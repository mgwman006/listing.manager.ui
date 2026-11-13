import { useState } from "react";
import { Alert, Button, Form, Input, InputNumber, Modal, notification, Typography } from "antd";
import { ScheduleOutlined } from "@ant-design/icons";
import { CreateViewingBookingDTO, UnitDetailsDTO } from "../models/property";
import { useAccount } from "../store/account/AccountContext";
import { createViewingBooking } from "../services/unitListingService";
import { isTokenExpired, navigateToAuth } from "../utilities/auth";

const { Paragraph } = Typography;

type ViewingFormValues = CreateViewingBookingDTO;

const toLocalDateTimeInput = (date: Date) => {
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
};

type Props = {
    unit: UnitDetailsDTO;
    block?: boolean;
};

export default function ScheduleViewingButton({ unit, block = false }: Props) {
    const { accountState } = useAccount();
    const [notificationApi, contextHolder] = notification.useNotification();
    const [form] = Form.useForm<ViewingFormValues>();
    const [open, setOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const token = accountState.accountDetails?.token ?? "";
    const signedIn = Boolean(token && !isTokenExpired(token));
    const startTime = Form.useWatch("startTime", form);

    const openModal = () => {
        const start = new Date(Date.now() + 24 * 60 * 60 * 1000);
        start.setHours(10, 0, 0, 0);
        form.setFieldsValue({
            rentalProfileId: unit.rentalProfileId,
            unitId: unit.id,
            requesterUserAccountId: accountState.accountDetails?.id ?? 0,
            serviceFee: 0,
            startTime: toLocalDateTimeInput(start),
            endTime: toLocalDateTimeInput(new Date(start.getTime() + 30 * 60 * 1000)),
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

        setFormError(null);
        setSubmitting(true);
        const request: CreateViewingBookingDTO = {
            ...values,
            requesterUserAccountId,
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
            <Button
                type="primary"
                icon={<ScheduleOutlined />}
                block={block}
                onClick={openModal}
            >
                Schedule viewing
            </Button>
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
                        <Form.Item label="Agency" name="rentalProfileId">
                            <InputNumber disabled controls={false} style={{ width: "100%" }} />
                        </Form.Item>

                        <Form.Item label="Unit" name="unitId">
                            <InputNumber disabled controls={false} style={{ width: "100%" }} />
                        </Form.Item>

                        {signedIn && (
                            <Form.Item label="Requester account" name="requesterUserAccountId">
                                <InputNumber disabled controls={false} style={{ width: "100%" }} />
                            </Form.Item>
                        )}
                        <Form.Item name="serviceFee" hidden>
                            <InputNumber />
                        </Form.Item>

                        <Form.Item
                            label="Preferred start"
                            name="startTime"
                            rules={[
                                { required: true, message: "Choose a preferred start time." },
                                {
                                    validator: (_, value?: string) => {
                                        if (!value) return Promise.resolve();
                                        const start = new Date(value);
                                        return !Number.isNaN(start.getTime()) && start > new Date()
                                            ? Promise.resolve()
                                            : Promise.reject(new Error("Start time must be in the future."));
                                    },
                                },
                            ]}
                        >
                            <Input
                                type="datetime-local"
                                min={toLocalDateTimeInput(new Date())}
                            />
                        </Form.Item>
                        <Form.Item
                            label="Preferred end"
                            name="endTime"
                            dependencies={["startTime"]}
                            rules={[
                                { required: true, message: "Choose a preferred end time." },
                                ({ getFieldValue }) => ({
                                    validator: (_, value?: string) => {
                                        if (!value) return Promise.resolve();
                                        const end = new Date(value);
                                        const start = new Date(getFieldValue("startTime"));
                                        return !Number.isNaN(end.getTime())
                                            && !Number.isNaN(start.getTime())
                                            && end > start
                                            ? Promise.resolve()
                                            : Promise.reject(new Error("End time must be after the start time."));
                                    },
                                }),
                            ]}
                        >
                            <Input
                                type="datetime-local"
                                min={startTime || toLocalDateTimeInput(new Date())}
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
