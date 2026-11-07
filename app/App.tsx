import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ConfigProvider } from "antd";
import routes from "./routes";

type RouteConfig = {
  path: string;
  Component?: React.ComponentType<any>;
  children?: RouteConfig[];
};

function renderRoutes(routes: RouteConfig[]) {
  return routes.map(({ path, Component, children }) => {
    const RouteComponent = Component ?? React.Fragment;
    return (
      <Route key={path} path={path} Component={RouteComponent}>
        {children && renderRoutes(children)}
      </Route>
    );
  });
}


export default function App() {
return (
<ConfigProvider
  theme={{
    token: {
      colorPrimary: "#0F766E",
      colorInfo: "#0F766E",
      colorText: "#0F172A",
      colorTextSecondary: "#64748B",
      colorBorder: "#E2E8F0",
      colorBgLayout: "#F8FAFC",
      borderRadius: 8,
      fontFamily: '"DM Sans", sans-serif',
    },
  }}
>
  <BrowserRouter>
    <Routes>{renderRoutes(routes)}</Routes>
  </BrowserRouter>
</ConfigProvider>
 );
}
