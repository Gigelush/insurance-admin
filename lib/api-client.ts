
export const apiClient = {
    async get(endpoint: string) {
        const res = await fetch(`/api${endpoint}`);
        if (!res.ok) throw new Error(`GET ${endpoint} failed`);
        return res.json();
    },

    async post(endpoint: string, data: any) {
        const res = await fetch(`/api${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error(`POST ${endpoint} failed`);
        return res.json();
    },

    async put(endpoint: string, data: any) {
        const res = await fetch(`/api${endpoint}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error(`PUT ${endpoint} failed`);
        return res.json();
    },

    async delete(endpoint: string) {
        const res = await fetch(`/api${endpoint}`, {
            method: 'DELETE'
        });
        if (!res.ok) throw new Error(`DELETE ${endpoint} failed`);
        return res.json();
    }
};
