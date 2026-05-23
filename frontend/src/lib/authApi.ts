import axios from "axios";

const AUTH_BASE_URL = "http://localhost:8090/api/auth";

export type LoginPayload = {
    email: string;
    password: string;
};

export type LoginResponse = {
    token: string;
    role: string;
};

export type CurrentUser = {
    id: number;
    email: string;
    role: string;
    designation: string | null;
    clientId: number | null;
    clientName: string | null;
    branchId: number | null;
    branchName: string | null;
};

export const authApi = {
    login: (data: LoginPayload) =>
        axios.post<LoginResponse>(`${AUTH_BASE_URL}/login`, data).then((res) => res.data),

    me: () =>
        axios
            .get<CurrentUser>(`${AUTH_BASE_URL}/me`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            })
            .then((res) => res.data),
};

export const getRouteByRole = (role: string) => {
    switch (role) {
        case "AREA_MANAGER":
            return "/area-manager";
        case "SECURITY_OFFICER":
            return "/security-officer";
        case "EXECUTIVE":
            return "/executive-officer";
        case "OPERATIONAL_MANAGER":
            return "/operational-manager";
        case "CHAIRMAN":
            return "/chairman";
        case "DIRECTOR":
            return "/director";
        default:
            return "/";
    }
};