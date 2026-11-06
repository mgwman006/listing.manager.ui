import { useEffect, useMemo, useState } from "react";
import {
    Alert,
    Button,
    Card,
    Col,
    Empty,
    Form,
    Input,
    Modal,
    notification,
    Pagination,
    Row,
    Select,
    Spin,
    Tag,
    Typography,
} from "antd";
import { ArrowRightOutlined, EnvironmentOutlined, SearchOutlined } from "@ant-design/icons";
import { useSearchParams } from "react-router-dom";
import { ApiError } from "../models/error";
import {
    CreateViewingBookingDTO,
    ListedUnitDTO,
    ListedUnitsPageDTO,
    ListedUnitsQuery,
    UnitStatus,
    UnitType,
} from "../models/property";
import { AccountState } from "../models/user";
import { useAccount } from "../store/account/AccountContext";
import { createViewingBooking, getListedUnits } from "../services/unitListingService";
import { isTokenExpired, navigateToAuth } from "../utilities/auth";
import "./unitListingPage.css";

const { Title, Text, Paragraph } = Typography;
const PAGE_SIZE = 12;

const unitTypeOptions = Object.values(UnitType).map((type) => ({
    value: type,
    label: type.toLowerCase().replaceAll("_", " "),
}));

const formatType = (type: string) => type.toLowerCase().replaceAll("_", " ");

const formatAddress = (unit: ListedUnitDTO) => {
    const address = unit.address
        ?? unit.propertyAddress
        ?? unit.location?.address
        ?? unit.building?.property?.location?.address
        ?? unit.property?.location?.address;
    if (address?.displayName) return address.displayName;
    return [
        address?.streetNumber,
        address?.streetName,
        address?.city,
        address?.region,
    ].filter(Boolean).join(", ");
};

const toLocalDateTimeInput = (date: Date) => {
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
};

const initialPage: ListedUnitsPageDTO = {
    content: [],
    totalElements: 0,
    totalPages: 0,
    number: 0,
    size: PAGE_SIZE,
};

export default function UnitListingPage() {
    const [searchParams] = useSearchParams();
    const { accountState, dispatchAccountState } = useAccount();
    const [notificationApi, contextHolder] = notification.useNotification();
    const [page, setPage] = useState(initialPage);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const [filters, setFilters] = useState({
        query: "",
        city: "",
        type: undefined as UnitType | undefined,
        minBedrooms: "",
        minRent: "",
        maxRent: "",
        direction: "asc" as "asc" | "desc",
    });
    const [pageNumber, setPageNumber] = useState(0);
    const [bookingUnit, setBookingUnit] = useState<ListedUnitDTO | null>(null);
    const [bookingSubmitting, setBookingSubmitting] = useState(false);
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [notes, setNotes] = useState("");
    const [formError, setFormError] = useState<string | null>(null);

    const token = accountState.accountDetails?.token ?? "";
    const signedIn = Boolean(token && !isTokenExpired(token));

    useEffect(() => {
        const accountStateString = searchParams.get("state");
        if (!accountStateString) return;

        try {
            const receivedAccountState: AccountState = JSON.parse(accountStateString);
            if (receivedAccountState.accountDetails?.token) {
                dispatchAccountState({
                    type: "FETCH_SUCCESS",
                    payload: receivedAccountState.accountDetails,
                });
            }
        } catch (error) {
            console.error("Unable to read account state returned from sign-in", error);
            notificationApi.error({
                title: "Unable to complete sign-in",
                description: "Please sign in again before requesting a viewing.",
            });
        }
    }, [dispatchAccountState, notificationApi, searchParams]);

    const query = useMemo<ListedUnitsQuery>(() => ({
        page: pageNumber,
        size: PAGE_SIZE,
        sortBy: "rentAmount",
        direction: filters.direction,
        listed: true,
        status: UnitStatus.AVAILABLE,
        ...(filters.query.trim() && { query: filters.query.trim() }),
        ...(filters.city.trim() && { city: filters.city.trim() }),
        ...(filters.type && { type: filters.type }),
        ...(filters.minBedrooms && { minBedrooms: Number(filters.minBedrooms) }),
        ...(filters.minRent && { minRent: Number(filters.minRent) }),
        ...(filters.maxRent && { maxRent: Number(filters.maxRent) }),
    }), [filters, pageNumber]);

    useEffect(() => {
        const controller = new AbortController();
        setLoading(true);
        setLoadError(null);
        getListedUnits(query, controller.signal)
            .then((result) => {
                setPage(result);
            })
            .catch((error: unknown) => {
                if (controller.signal.aborted) return;
                const message = error instanceof ApiError && error.details
                    ? typeof error.details === "string"
                        ? error.details
                        : JSON.stringify(error.details)
                    : error instanceof ApiError
                        ? error.message
                        : "We couldn’t load listings. Please try again.";
                setLoadError(message);
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false);
            });

        return () => controller.abort();
    }, [notificationApi, query, refreshKey]);

    const updateFilter = (key: keyof typeof filters, value: string | UnitType | undefined) => {
        setFilters((current) => ({ ...current, [key]: value }));
        setPageNumber(0);
    };

    const handleBookViewing = async () => {
        if (!bookingUnit) return;
        if (!signedIn) {
            setFormError("Sign in to your account before requesting a viewing.");
            return;
        }
        const start = new Date(startTime);
        const end = new Date(endTime);
        if (
            !startTime
            || !endTime
            || Number.isNaN(start.getTime())
            || Number.isNaN(end.getTime())
            || start <= new Date()
            || end <= start
        ) {
            setFormError("Choose a future start and end time. The end must be after the start.");
            return;
        }

        setFormError(null);
        setBookingSubmitting(true);
        const request: CreateViewingBookingDTO = {
            unitId: bookingUnit.id,
            startTime: startTime.replace(" ", "T"),
            endTime: endTime.replace(" ", "T"),
            ...(notes.trim() && { notes: notes.trim() }),
        };
        const booking = await createViewingBooking(request, token, notificationApi);
        setBookingSubmitting(false);
        if (booking) {
            notificationApi.success({
                title: "Viewing request sent",
                description: "The property manager will follow up about your requested time.",
            });
            setBookingUnit(null);
        }
    };

    const openBooking = (unit: ListedUnitDTO) => {
        setBookingUnit(unit);
        setFormError(null);
        setNotes("");
        const suggestedStart = new Date(Date.now() + 24 * 60 * 60 * 1000);
        suggestedStart.setHours(10, 0, 0, 0);
        const suggestedEnd = new Date(suggestedStart.getTime() + 30 * 60 * 1000);
        setStartTime(toLocalDateTimeInput(suggestedStart));
        setEndTime(toLocalDateTimeInput(suggestedEnd));
    };

    const handleSignIn = () => {
        if (!import.meta.env.VITE_AUTH_URL?.trim()) {
            notificationApi.error({
                title: "Sign-in is unavailable",
                description: "VITE_AUTH_URL is not configured for this application.",
            });
            return;
        }
        navigateToAuth("rent-manager", undefined, window.location.href);
    };

    return (
        <main className="listing-app">
            {contextHolder}
            <header className="listing-header">
                <a className="listing-brand" href="/" aria-label="Home">
                    <span className="brand-mark">la</span>
                    <span>living, found.</span>
                </a>
                <Button
                    type="text"
                    className="header-signin"
                    onClick={handleSignIn}
                    disabled={signedIn}
                >
                    {signedIn ? "Signed in" : "Sign in"}
                </Button>
            </header>

            <section className="listing-hero">
                <div className="hero-copy">
                    <Text className="eyebrow">A better way to find your next place</Text>
                    <Title className="hero-title">A place to call <em>yours.</em></Title>
                    <Paragraph className="hero-subtitle">
                        Thoughtful homes, ready when you are. Find a space that feels like the start of something.
                    </Paragraph>
                </div>
                <div className="hero-art" aria-hidden="true">
                    <div className="art-sun" />
                    <div className="art-building art-building-back" />
                    <div className="art-building art-building-front" />
                    <div className="art-plant" />
                </div>
            </section>

            <section className="listing-content">
                <div className="list-heading">
                    <div>
                        <Text className="eyebrow">Find your fit</Text>
                        <Title level={2}>Homes for rent</Title>
                    </div>
                    <Text type="secondary">{page.totalElements} places to explore</Text>
                </div>

                <Form className="listing-filters" layout="vertical">
                    <Form.Item label="Search">
                        <Input
                            allowClear
                            prefix={<SearchOutlined />}
                            placeholder="Neighborhood, street, or keyword"
                            value={filters.query}
                            onChange={(event) => updateFilter("query", event.target.value)}
                        />
                    </Form.Item>
                    <Form.Item label="City">
                        <Input
                            allowClear
                            placeholder="Any city"
                            value={filters.city}
                            onChange={(event) => updateFilter("city", event.target.value)}
                        />
                    </Form.Item>
                    <Form.Item label="Home type">
                        <Select
                            allowClear
                            placeholder="Any type"
                            options={unitTypeOptions}
                            value={filters.type}
                            onChange={(value) => updateFilter("type", value)}
                        />
                    </Form.Item>
                    <Form.Item label="Bedrooms">
                        <Select
                            allowClear
                            placeholder="Any"
                            value={filters.minBedrooms || undefined}
                            options={[1, 2, 3, 4, 5].map((value) => ({
                                value: String(value),
                                label: `${value}+`,
                            }))}
                            onChange={(value) => updateFilter("minBedrooms", value ?? "")}
                        />
                    </Form.Item>
                    <Form.Item label="Min. rent">
                        <Input
                            type="number"
                            min={0}
                            placeholder="$0"
                            value={filters.minRent}
                            onChange={(event) => updateFilter("minRent", event.target.value)}
                        />
                    </Form.Item>
                    <Form.Item label="Max. rent">
                        <Input
                            type="number"
                            min={0}
                            placeholder="No limit"
                            value={filters.maxRent}
                            onChange={(event) => updateFilter("maxRent", event.target.value)}
                        />
                    </Form.Item>
                    <Form.Item label="Sort by">
                        <Select
                            value={filters.direction}
                            options={[
                                { value: "asc", label: "Rent: low to high" },
                                { value: "desc", label: "Rent: high to low" },
                            ]}
                            onChange={(value) => updateFilter("direction", value)}
                        />
                    </Form.Item>
                </Form>

                {loadError && (
                    <Alert
                        type="error"
                        showIcon
                        title="We couldn’t load the homes"
                        description={loadError}
                        action={<Button onClick={() => setRefreshKey((current) => current + 1)}>Try again</Button>}
                    />
                )}

                {loading ? (
                    <div className="listing-loading"><Spin size="large" /></div>
                ) : page.content.length ? (
                    <>
                        <Row gutter={[20, 24]}>
                            {page.content.map((unit, index) => {
                                const address = formatAddress(unit);
                                const title = unit.listingTitle || unit.propertyName
                                    || unit.property?.name || unit.building?.property?.name
                                    || `Unit ${unit.unitNumber}`;
                                return (
                                    <Col key={unit.id} xs={24} sm={12} lg={8} xl={6}>
                                        <Card
                                            className="unit-card"
                                            cover={(
                                                <div className={`unit-cover cover-${index % 4}`}>
                                                    <span className="cover-label">Available now</span>
                                                    <span className="cover-number">
                                                        {String(unit.unitNumber).padStart(2, "0")}
                                                    </span>
                                                </div>
                                            )}
                                            bordered={false}
                                        >
                                            <div className="unit-card-heading">
                                                <div>
                                                    <Title level={4}>{title}</Title>
                                                    <Text type="secondary">
                                                        <EnvironmentOutlined /> {address || unit.buildingName
                                                            || unit.building?.name || "Location available on request"}
                                                    </Text>
                                                </div>
                                                <Tag>{formatType(unit.type)}</Tag>
                                            </div>
                                            <div className="unit-stats">
                                                <span><strong>{unit.numberOfBedrooms}</strong> bed</span>
                                                <span><strong>{unit.numberOfBathrooms}</strong> bath</span>
                                                {unit.roomSize > 0 && (
                                                    <span><strong>{unit.roomSize}</strong> {unit.sizeUnit}</span>
                                                )}
                                            </div>
                                            <div className="unit-card-footer">
                                                <div>
                                                    <strong className="unit-rent">
                                                        {new Intl.NumberFormat(undefined, {
                                                            style: "currency",
                                                            currency: "USD",
                                                            maximumFractionDigits: 0,
                                                        }).format(unit.rentAmount)}
                                                    </strong>
                                                    <Text type="secondary"> / month</Text>
                                                </div>
                                                <Button
                                                    type="primary"
                                                    shape="circle"
                                                    aria-label={`Request a viewing for ${title}`}
                                                    icon={<ArrowRightOutlined />}
                                                    onClick={() => openBooking(unit)}
                                                />
                                            </div>
                                        </Card>
                                    </Col>
                                );
                            })}
                        </Row>
                        <Pagination
                            className="listing-pagination"
                            current={pageNumber + 1}
                            pageSize={PAGE_SIZE}
                            total={page.totalElements}
                            onChange={(nextPage) => setPageNumber(nextPage - 1)}
                            showSizeChanger={false}
                        />
                    </>
                ) : loadError ? null : (
                    <Empty
                        className="listing-empty"
                        description="No homes match those filters yet. Try adjusting your search."
                    />
                )}
            </section>

            <footer className="listing-footer">
                <span>la · living, found.</span>
                <span>Find a place for what’s next.</span>
            </footer>

            <Modal
                title="Request a viewing"
                open={Boolean(bookingUnit)}
                onCancel={() => setBookingUnit(null)}
                onOk={handleBookViewing}
                okText="Send request"
                confirmLoading={bookingSubmitting}
                destroyOnHidden
            >
                {bookingUnit && (
                    <div className="booking-form">
                        <Paragraph>
                            Request a time to see <strong>{bookingUnit.listingTitle || `Unit ${bookingUnit.unitNumber}`}</strong>.
                        </Paragraph>
                        {!signedIn && (
                            <Alert
                                type="info"
                                showIcon
                                message="Sign in required"
                                description={(
                                    <span>
                                        Sign in before submitting a viewing request.{" "}
                                        <Button type="link" onClick={handleSignIn}>Sign in</Button>
                                    </span>
                                )}
                            />
                        )}
                        {formError && <Alert type="error" showIcon message={formError} />}
                        <label>
                            Preferred start
                            <Input
                                type="datetime-local"
                                min={toLocalDateTimeInput(new Date())}
                                value={startTime}
                                onChange={(event) => setStartTime(event.target.value)}
                            />
                        </label>
                        <label>
                            Preferred end
                            <Input
                                type="datetime-local"
                                min={startTime || toLocalDateTimeInput(new Date())}
                                value={endTime}
                                onChange={(event) => setEndTime(event.target.value)}
                            />
                        </label>
                        <label>
                            Note to the property manager (optional)
                            <Input.TextArea
                                rows={3}
                                maxLength={500}
                                value={notes}
                                onChange={(event) => setNotes(event.target.value)}
                            />
                        </label>
                    </div>
                )}
            </Modal>
        </main>
    );
}
