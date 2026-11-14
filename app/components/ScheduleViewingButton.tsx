import { useState } from "react";
import { Alert, Button, DatePicker, Form, Input, InputNumber, Modal, notification, Space, Typography } from "antd";
import { ScheduleOutlined, VideoCameraOutlined } from "@ant-design/icons";
import { CreateViewingBookingDTO, UnitDetailsDTO } from "../models/property";
import dayjs, { type Dayjs } from "dayjs";
import { useAccount } from "../store/account/AccountContext";
import { createViewingBooking } from "../services/unitListingService";
import { isTokenExpired, navigateToAuth } from "../utilities/auth";

const { Paragraph } = Typography;

type ViewingFormValues = Omit<CreateViewingBookingDTO, "startTime" | "endTime"> & {
    startTime: Dayjs;
};

const formatViewingFee = (fee: number) => new Intl.NumberFormat("en-TZ", {
    style: "currency",
    currency: "TZS",
    maximumFractionDigits: 0,
}).format(fee);

type Props = {
    unit: UnitDetailsDTO;
    viewingServiceFee: number | null;
    block?: boolean;
};

export default function ScheduleViewingButton({ unit, viewingServiceFee, block = false }: Props) {
    const { accountState } = useAccount();
    const [notificationApi, contextHolder] = notification.useNotification();
    const [form] = Form.useForm<ViewingFormValues>();
    const [open, setOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const token = accountState.accountDetails?.token ?? "";
    const signedIn = Boolean(token && !isTokenExpired(token));

    const openModal = () => {
        form.resetFields();
        form.setFieldsValue({
            rentalProfileId: unit.rentalProfileId,
            unitId: unit.id,
            requesterUserAccountId: accountState.accountDetails?.id ?? 0,
            serviceFee: viewingServiceFee ?? 0,
            notes: "",
        });
        setFormError(null);
        setOpen(true);
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

    const handleSubmit = async (values: ViewingFormValues) => {
        const requesterUserAccountId = accountState.accountDetails?.id;
        if (!signedIn || requesterUserAccountId === undefined) {
            setFormError("Sign in to your account before requesting a viewing.");
            return;
        }
        if (viewingServiceFee === null) {
            setFormError("The viewing fee is unavailable. Please try again later.");
            return;
        }

        setFormError(null);
        setSubmitting(true);
        const request: CreateViewingBookingDTO = {
            ...values,
            startTime: values.startTime.format("YYYY-MM-DDTHH:mm"),
            endTime: values.startTime.add(100, "minute").format("YYYY-MM-DDTHH:mm"),
            requesterUserAccountId,
            serviceFee: viewingServiceFee,
            ...(values.notes?.trim() && { notes: values.notes.trim() }),
        };
        try {
            const booking = await createViewingBooking(request, token, notificationApi);
            if (booking) {
                notificationApi.success({
                    title: "Viewing request sent",
                    description: "The property manager will follow up about your requested time.",
                });
                setOpen(false);
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            {contextHolder}
            <Space direction="vertical" size="small" style={block ? { width: "100%" } : undefined}>
                <Paragraph style={{ marginBottom: 0 }}>
                    Viewing fee: <strong>{viewingServiceFee === null
                        ? "Currently unavailable"
                        : formatViewingFee(viewingServiceFee)}</strong>
                </Paragraph>
                <Button
                    type="primary"
                    icon={<ScheduleOutlined />}
                    block={block}
                    onClick={openModal}
                >
                    Schedule viewing
                </Button>
                <Button
                    icon={<VideoCameraOutlined />}
                    block={block}
                    onClick={() => notificationApi.info({ title: "Virtual viewing coming soon" })}
                >
                    Virtual viewing
                </Button>
            </Space>
            <Modal
                title="Request a viewing"
                open={open}
                onCancel={() => setOpen(false)}
                onOk={() => form.submit()}
                okText="Send request"
                confirmLoading={submitting}
                destroyOnHidden
            >
                <div className="booking-form">
                    <Paragraph>
                        Request a time to see <strong>Unit {unit.unitNumber}</strong>.
                    </Paragraph>
                    {!signedIn && (
                        <Alert
                            type="info"
                            showIcon
                            title="Sign in required"
                            description={(
                                <span>
                                    Sign in before submitting a viewing request.{" "}
                                    <Button type="link" onClick={handleSignIn}>Sign in</Button>
                                </span>
                            )}
                        />
                    )}
                    {formError && <Alert type="error" showIcon title={formError} />}
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={handleSubmit}
                    >
                        <Form.Item label="Agency" name="rentalProfileId" hidden>
                            <InputNumber disabled controls={false} style={{ width: "100%" }} />
                        </Form.Item>

                        <Form.Item label="Unit" name="unitId" hidden>
                            <InputNumber disabled controls={false} style={{ width: "100%" }} />
                        </Form.Item>
                        
                        <Form.Item label="Requester account" name="requesterUserAccountId" hidden>
                            <InputNumber disabled controls={false} style={{ width: "100%" }} />
                        </Form.Item>
                        
                        <Form.Item name="serviceFee" hidden>
                            <InputNumber />
                        </Form.Item>

                        <Form.Item
                            label="Date and time"
                            name="startTime"
                            rules={[
                                { required: true, message: "Choose a date and time." },
                                {
                                    validator: (_, value?: Dayjs) => {
                                        if (!value) return Promise.resolve();
                                        return value.isAfter(dayjs())
                                            ? Promise.resolve()
                                            : Promise.reject(new Error("Start time must be in the future."));
                                    },
                                },
                            ]}
                        >
                            <DatePicker
                                showTime={{ format: "h:mm A", use12Hours: true }}
                                format="YYYY-MM-DD h:mm A"
                                needConfirm
                                disabledDate={(date) => date.isBefore(dayjs(), "day")}
                                placeholder="Select date and time"
                                style={{ width: "100%" }}
                            />
                        </Form.Item>
                        <Form.Item
                            label="Note to the property manager (optional)"
                            name="notes"
                        >
                            <Input.TextArea rows={3} maxLength={500} />
                        </Form.Item>
                    </Form>
                </div>
            </Modal>
        </>
    );
}
