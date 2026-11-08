import { useState } from "react";
import { Alert, Button, Input, Modal, notification, Typography } from "antd";
import { ScheduleOutlined } from "@ant-design/icons";
import { CreateViewingBookingDTO, ListedUnitDTO } from "../models/property";
import { useAccount } from "../store/account/AccountContext";
import { createViewingBooking } from "../services/unitListingService";
import { isTokenExpired, navigateToAuth } from "../utilities/auth";

const { Paragraph } = Typography;

const toLocalDateTimeInput = (date: Date) => {
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
};

type Props = {
    unit: ListedUnitDTO;
    block?: boolean;
};

export default function ScheduleViewingButton({ unit, block = false }: Props) {
    const { accountState } = useAccount();
    const [notificationApi, contextHolder] = notification.useNotification();
    const [open, setOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [notes, setNotes] = useState("");
    const [formError, setFormError] = useState<string | null>(null);
    const token = accountState.accountDetails?.token ?? "";
    const signedIn = Boolean(token && !isTokenExpired(token));

    const openModal = () => {
        const start = new Date(Date.now() + 24 * 60 * 60 * 1000);
        start.setHours(10, 0, 0, 0);
        setStartTime(toLocalDateTimeInput(start));
        setEndTime(toLocalDateTimeInput(new Date(start.getTime() + 30 * 60 * 1000)));
        setNotes("");
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

    const handleSubmit = async () => {
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
        setSubmitting(true);
        const request: CreateViewingBookingDTO = {
            unitId: unit.id,
            startTime,
            endTime,
            ...(notes.trim() && { notes: notes.trim() }),
        };
        const booking = await createViewingBooking(request, token, notificationApi);
        setSubmitting(false);
        if (booking) {
            notificationApi.success({
                title: "Viewing request sent",
                description: "The property manager will follow up about your requested time.",
            });
            setOpen(false);
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
                onOk={handleSubmit}
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
            </Modal>
        </>
    );
}
