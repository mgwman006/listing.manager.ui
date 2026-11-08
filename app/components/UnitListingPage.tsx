import { useEffect, useMemo, useState } from "react";
import {
    Alert,
    Button,
    Card,
    Col,
    Empty,
    Form,
    Input,
    notification,
    Pagination,
    Row,
    Select,
    Spin,
    Tag,
    Typography,
} from "antd";
import { ArrowRightOutlined, EnvironmentOutlined, SearchOutlined } from "@ant-design/icons";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ApiError } from "../models/error";
import {
    AddressDTO,
    ListedUnitsQuery,
    PageDTO,
    UnitStatus,
    UnitType,
} from "../models/property";
import { AccountState } from "../models/user";
import { useAccount } from "../store/account/AccountContext";
import { isTokenExpired } from "../utilities/auth";
import { getPaginatedUnits } from "../services/unitListingService";

const { Title, Text, Paragraph } = Typography;
const PAGE_SIZE = 12;

const unitTypeOptions = Object.values(UnitType).map((type) => ({
    value: type,
    label: type.toLowerCase().replaceAll("_", " "),
}));

const formatType = (type: string) => type.toLowerCase().replaceAll("_", " ");

const formatAddress = (address: AddressDTO) => {
    return [
        address?.streetNumber,
        address?.streetName,
        address?.city,
        address?.region,
    ].filter(Boolean).join(", ");
};

const initialPage: PageDTO = {
    items: [],
    page: 0,
    size: PAGE_SIZE,
    totalElements: 0,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false,
};

export default function UnitListingPage() {
    const [searchParams] = useSearchParams();
    const { accountState, dispatchAccountState } = useAccount();
    const navigate = useNavigate();
    const [notificationApi, contextHolder] = notification.useNotification();
    const [page, setPage] = useState(initialPage);
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
        isListed: true,
        status: UnitStatus.AVAILABLE,
        ...(filters.query.trim() && { query: filters.query.trim() }),
        ...(filters.city.trim() && { city: filters.city.trim() }),
        ...(filters.type && { type: filters.type }),
        ...(filters.minBedrooms && { minBedrooms: Number(filters.minBedrooms) }),
        ...(filters.minRent && { minRent: Number(filters.minRent) }),
        ...(filters.maxRent && { maxRent: Number(filters.maxRent) }),
    }), [filters, pageNumber]);

    const loadPage = async () => {
        const controller = new AbortController();
        const res = await getPaginatedUnits(query, controller.signal);
        setPage(res);
    };

    useEffect(() => {
        const controller = new AbortController();
        loadPage();

        return () => controller.abort();
    }, [notificationApi, query, refreshKey]);

    const updateFilter = (key: keyof typeof filters, value: string | UnitType | undefined) => {
        setFilters((current) => ({ ...current, [key]: value }));
        setPageNumber(0);
    };

    return (
        <main className="listing-app">
            {contextHolder}
            <section className="listing-hero">
                <div className="hero-copy">
                    <Text className="eyebrow">A better way to find your next place</Text>
                    <Title className="hero-title">A place to call <em>yours.</em></Title>
                    <Paragraph className="hero-subtitle">
                        Thoughtful homes, ready when you are. Find a space that feels like the start of something.
                    </Paragraph>
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

               

                {page.items.length ? (
                    <>
                        <Row gutter={[20, 24]}>
                            {page.items.map((unit, index) => {
                                const address = formatAddress(unit.location.address);
                                const title = `${unit.propertyName} | Unit ${unit.unitNumber}`;
                                return (
                                    <Col key={unit.id} xs={24} sm={12} lg={8} xl={6}>
                                        <Card
                                            className="unit-card"
                                            cover={(
                                                <div className={`unit-cover cover-${index % 4}`}>
                                                    <span className="cover-label">
                                                        {unit.status ? formatType(unit.status) : "Status unavailable"}
                                                    </span>
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
                                                        <EnvironmentOutlined /> {address || "Location available on request"}
                                                    </Text>
                                                </div>
                                                <Tag>{formatType(unit.type)}</Tag>
                                            </div>
                                            <div className="unit-stats">
                                                <span><strong>{unit.numberOfBedrooms}</strong> bed</span>
                                                <span><strong>{unit.numberOfBathrooms}</strong> bath</span>
                                                {(unit.roomSize ?? 0) > 0 && (
                                                    <span><strong>{unit.roomSize}</strong> {unit.sizeUnit}</span>
                                                )}
                                            </div>
                                            <div className="unit-card-footer">
                                                <div>
                                                    <strong className="unit-rent">
                                                        {new Intl.NumberFormat("en-TZ", {
                                                            style: "currency",
                                                            currency: "TZS",
                                                            maximumFractionDigits: 0,
                                                        }).format(unit.rentAmount)}
                                                    </strong>
                                                    <Text type="secondary"> / month</Text>
                                                </div>
                                                <Button
                                                    type="default"
                                                    aria-label={`View details for ${title}`}
                                                    icon={<ArrowRightOutlined />}
                                                    onClick={() => navigate(`/units/${unit.id}`)}
                                                >Details</Button>
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
                ) :  (
                    <Empty
                        className="listing-empty"
                        description="No homes match those filters yet. Try adjusting your search."
                    />
                )}
            </section>

        </main>
    );
}
