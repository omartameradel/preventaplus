import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard.jsx";
import IndexPage from "./pages/index.jsx";

export default function App() {
  return React.createElement(
    Router,
    null,
    React.createElement(
      Routes,
      null,
      React.createElement(Route, { path: "/", element: React.createElement(IndexPage, null) }),
      React.createElement(Route, { path: "/dashboard", element: React.createElement(Dashboard, null) })
    )
  );
}
