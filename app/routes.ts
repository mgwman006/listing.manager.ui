import HomeComponent from "./components/HomeComponent";
import UnitListingPage from "./components/UnitListingPage";
import UnitDetailsPage from "./components/UnitDetailsPage";

const routes = [
  {
    path: "/",
    Component: HomeComponent,
    children: [
      {
        path: "",
        index: true,
        Component: UnitListingPage,
      },
      {
        path: "units/:unitId",
        Component: UnitDetailsPage,
      },
    ],
  },
];

export default routes;
