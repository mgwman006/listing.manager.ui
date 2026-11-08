import { useEffect, useState } from "react";
import {
    Alert,
    Button,
    Card,
    Col,
    Descriptions,
    Empty,
    Image,
    Row,
    Skeleton,
    Space,
    Tag,
    Typography,
} from "antd";
import { ArrowLeftOutlined, EnvironmentOutlined, ShopOutlined } from "@ant-design/icons";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
    getRentalProfileById,
    getUnitById,
} from "../services/unitListingService";
import { RentalProfileDetailsDTO } from "../models/rentalProfile";
import { AccountState } from "../models/user";
import { useAccount } from "../store/account/AccountContext";
import { isTokenExpired } from "../utilities/auth";
import ScheduleViewingButton from "./ScheduleViewingButton";
import { AddressDTO, UnitDetailsDTO, UnitImageDTO } from "../models/property";

const { Title, Text, Paragraph } = Typography;

const formatLabel = (value?: string | null) =>
    value ? value.toLowerCase().replaceAll("_", " ") : "Not provided";

const formatAddress = (address: AddressDTO) => { 
    return [
        address?.streetNumber,
        address?.streetName,
        address?.ward,
        address?.city,
        address?.region,
        address?.country,
    ].filter(Boolean).join(", ");
};

const formatRent = (rentAmount: number) => new Intl.NumberFormat("en-TZ", {
    style: "currency",
    currency: "TZS",
    maximumFractionDigits: 0,
}).format(rentAmount);

export default function UnitDetailsPage() {
    const { unitId } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { accountState, dispatchAccountState } = useAccount();
    const [unit, setUnit] = useState<UnitDetailsDTO | null>(null);
    const [rentalProfile, setRentalProfile] = useState<RentalProfileDetailsDTO | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [profileError, setProfileError] = useState<string | null>(null);
    const token = accountState.accountDetails?.token ?? "";
    const signedIn = Boolean(token && !isTokenExpired(token));
    const parsedUnitId = Number(unitId);

    const loadUnitDetails = async (unitId: number, signal: AbortSignal) => {

        const unitDetails = await getUnitById(unitId, signal);
        setUnit(unitDetails);
    }

    const loadRentalProfileDetails = async (rentalProfileId: number, token: string) => {
        const profileDetails = await getRentalProfileById(rentalProfileId, token);
        setRentalProfile(profileDetails);
    }

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
            setProfileError("We couldn’t complete sign-in. Please try again.");
        }
    }, [dispatchAccountState, searchParams]);

    useEffect(() => {
        if (!Number.isSafeInteger(parsedUnitId) || parsedUnitId <= 0) {
            setLoadError("This listing link is invalid.");
            return;
        }

        const controller = new AbortController();
        setUnit(null);
        setRentalProfile(null);
        setProfileError(null);
        setLoadError(null);
        loadUnitDetails(parsedUnitId, controller.signal);

        return () => controller.abort();
    }, [parsedUnitId]);

    useEffect(() => {
        if (!unit || !signedIn) {
            setRentalProfile(null);
            return;
        }
        loadRentalProfileDetails(unit.rentalProfileId,token);
    }, [signedIn, token, unit]);
   

    return (
        <main className="listing-app">
            <section className="unit-details-content">
                <Button
                    className="details-back"
                    icon={<ArrowLeftOutlined />}
                    type="text"
                    onClick={() => navigate(-1)}
                >
                    Back to listings
                </Button>

                {loadError || !unit ? (
                    <Empty
                        description={loadError ?? "This listing is no longer available."}
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                    >
                        <Button type="primary" onClick={() => navigate("/")}>Browse homes</Button>
                    </Empty>
                ) : (
                    <>
                        <Row gutter={[28, 28]}>
                            <Col xs={24} lg={15}>
                                {unit?.images?.length ? (
                                    <Image.PreviewGroup>
                                        <div className="unit-detail-gallery">
                                            {unit.images.map((image) => (
                                                <Image
                                                    key={image.id}
                                                    src={image.url}
                                                    alt={`Unit ${unit.unitNumber}`}
                                                    className="unit-detail-image"
                                                />
                                            ))}
                                        </div>
                                    </Image.PreviewGroup>
                                ) : (
                                    <div className="unit-detail-placeholder">
                                        <span>Unit {unit.unitNumber}</span>
                                    </div>
                                )}

                                <Card className="details-card" bordered={false}>
                                    <Space direction="vertical" size={8}>
                                        <Tag color="green">{formatLabel(unit.status)}</Tag>
                                        <Title level={2}>
                                            {`${unit.building.property.name} | Unit ${unit.unitNumber}`}
                                        </Title>
                                        <Text type="secondary">
                                            <EnvironmentOutlined /> {formatAddress(unit.building.property.location.address)}
                                        </Text>
                                        <Paragraph>{unit.building.property.description || "Contact the rental manager to learn more about this home."}</Paragraph>
                                    </Space>
                                </Card>


                                <Card title="Unit details" className="details-card">
                                    <Descriptions column={{ xs: 1, sm: 2 }} bordered size="small">
                                        <Descriptions.Item label="Unit type">{formatLabel(unit.type)}</Descriptions.Item>
                                        <Descriptions.Item label="Bedrooms">{unit.numberOfBedrooms}</Descriptions.Item>
                                        <Descriptions.Item label="Bathrooms">{unit.numberOfBathrooms}</Descriptions.Item>
                                        <Descriptions.Item label="Parking spaces">{unit.numberParkingSpots}</Descriptions.Item>
                                        <Descriptions.Item label=" Room Size">
                                            {unit.roomSize ?? "Not provided"} {unit.sizeUnit ?? ""}
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Building/Block Number">{unit.building.number}</Descriptions.Item>
                                        <Descriptions.Item label="Floor Number">{unit.floorNumber}</Descriptions.Item>
                                    </Descriptions>
                                </Card>
                            </Col>

                            <Col xs={24} lg={9}>
                                <Card className="details-action-card" bordered={false}>
                                    <Text className="eyebrow">Monthly rent</Text>
                                    <Title level={2}>{formatRent(unit.rentAmount)}<Text type="secondary"> / month</Text></Title>
                                    <ScheduleViewingButton unit={unit} block />
                                </Card>

                                <Card
                                    title={<Space><ShopOutlined /> Agency</Space>}
                                    className="details-card"
                                >
                                    {rentalProfile ? (
                                        <Descriptions column={1} size="small">
                                            <Descriptions.Item label="Name">{rentalProfile.name}</Descriptions.Item>
                                            <Descriptions.Item label="Agency type">{formatLabel(rentalProfile.type)}</Descriptions.Item>
                                            <Descriptions.Item label="Email">
                                                {rentalProfile.email || "Not provided"}
                                            </Descriptions.Item>
                                            <Descriptions.Item label="Phone">
                                                {rentalProfile.phoneNumber || "Not provided"}
                                            </Descriptions.Item>
                                            {rentalProfile.organizationId && (
                                                <Descriptions.Item label="Organization ID">
                                                    {rentalProfile.organizationId}
                                                </Descriptions.Item>
                                            )}
                                        </Descriptions>
                                    ) : signedIn ? (
                                        <Alert
                                            type="warning"
                                            showIcon
                                            title="Agency unavailable"
                                            description={profileError ?? "Agency details could not be loaded."}
                                        />
                                    ) : (
                                        <Alert
                                            type="info"
                                            showIcon
                                            title="Sign in to view profile details"
                                            description={`This listing is managed by agency ${unit.rentalProfileId}. Sign in to view its contact information.`}
                                        />
                                    )}
                                </Card>
                            </Col>
                        </Row>
                    </>
                )}
            </section>

        </main>
    );
}
