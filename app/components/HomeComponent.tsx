import {
    Button,
    Dropdown,
    Layout,
    Menu,
    notification,
    Space,
    Typography,
} from "antd";
import { MenuOutlined } from "@ant-design/icons";
import type { MenuProps } from "antd";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAccount } from "../store/account/AccountContext";
import { isTokenExpired, navigateToAuth } from "../utilities/auth";

const { Header, Content, Footer } = Layout;
const { Text } = Typography;

const tenantAppUrl = import.meta.env.VITE_TENANT_UI_URL?.trim();
const agentAppUrl = import.meta.env.VITE_AGENT_LANDLORD_UI_URL?.trim();

export default function HomeComponent() {
    const location = useLocation();
    const { accountState } = useAccount();
    const [notificationApi, contextHolder] = notification.useNotification();
    const token = accountState.accountDetails?.token ?? "";
    const signedIn = Boolean(token && !isTokenExpired(token));

    const appLink = (label: string, url?: string) => ({
        key: label,
        disabled: !url,
        label: url ? (
            <a href={url} target="_blank" rel="noreferrer">
                {label}
            </a>
        ) : (
            <span title="Configure this app URL to enable the link">{label}</span>
        ),
    });

    const menuItems: MenuProps["items"] = [
        {
            key: "listings",
            label: <Link to="/">Find a home</Link>,
        },
        appLink("Tenant app", tenantAppUrl),
        appLink("Agent / landlord app", agentAppUrl),
    ];

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
        <Layout className="site-layout">
            {contextHolder}
            <Header className="site-header">
                <Link className="site-brand" to="/" aria-label="Tante home">
                    <img src="/tante-logo.svg" alt="Tante" />
                </Link>

                <nav className="desktop-navigation" aria-label="Main navigation">
                    <Menu
                        mode="horizontal"
                        selectedKeys={location.pathname === "/" || location.pathname.startsWith("/units/")
                            ? ["listings"]
                            : []}
                        items={menuItems}
                    />
                </nav>

                <Space className="site-header-actions">
                    <Button
                        type="text"
                        className="header-signin"
                        onClick={handleSignIn}
                        disabled={signedIn}
                    >
                        {signedIn ? "Signed in" : "Sign in"}
                    </Button>
                    <Dropdown menu={{ items: menuItems }} trigger={["click"]} placement="bottomRight">
                        <Button
                            className="mobile-navigation-trigger"
                            icon={<MenuOutlined />}
                            aria-label="Open navigation menu"
                        />
                    </Dropdown>
                </Space>
            </Header>

            <Content className="site-content">
                <Outlet />
            </Content>

            <Footer className="site-footer">
                <Text strong className="site-footer-brand">Tante</Text>
                <Text type="secondary">Find a place for what’s next.</Text>
                <Space className="site-footer-links" size="large">
                    {tenantAppUrl && (
                        <a href={tenantAppUrl} target="_blank" rel="noreferrer">Tenant app</a>
                    )}
                    {agentAppUrl && (
                        <a href={agentAppUrl} target="_blank" rel="noreferrer">Agent / landlord app</a>
                    )}
                </Space>
            </Footer>
        </Layout>
    );
}
