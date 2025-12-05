import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import Scanner from '../pages/Scanner';
import ScanResult from '../pages/ScanResult';
import ShippingStatus from "../pages/ShippingStatus";
import Collaborators from "../pages/Collaborators";
import CollaboratorAccess from "../pages/CollaboratorAccess";
import NotFound from '../pages/NotFound';

function AppRouter() {
	return (
		<BrowserRouter>
		<Routes>
			<Route path="/" element={<Login />} />
			<Route path="/dashboard" element={<Dashboard />} />
			<Route path="/scanner" element={<Scanner />} />
			<Route path="/scan-result/:data" element={<ScanResult />} />
			<Route path="/shipping-status" element={<ShippingStatus />} />
			<Route path="/collaborators" element={<Collaborators />} />
			<Route path="/collaborator/:id" element={<CollaboratorAccess />} />
			<Route path="*" element={<NotFound />} />
		</Routes>
		</BrowserRouter>
	);
}

export default AppRouter;