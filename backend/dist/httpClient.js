"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.get = get;
exports.post = post;
exports.put = put;
exports.del = del;
async function get(url) {
    const res = await fetch(url, { method: "GET", headers: { "Content-Type": "application/json" } });
    if (!res.ok) {
        const err = (await res.json().catch(() => ({})));
        throw new Error(err.message ?? `HTTP ${res.status}: ${url}`);
    }
    return res.json();
}
async function post(url, body) {
    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const err = (await res.json().catch(() => ({})));
        throw new Error(err.message ?? `HTTP ${res.status}: ${url}`);
    }
    return res.json();
}
async function put(url, body) {
    const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const err = (await res.json().catch(() => ({})));
        throw new Error(err.message ?? `HTTP ${res.status}: ${url}`);
    }
    return res.json();
}
async function del(url) {
    const res = await fetch(url, { method: "DELETE" });
    if (!res.ok) {
        const err = (await res.json().catch(() => ({})));
        throw new Error(err.message ?? `HTTP ${res.status}: ${url}`);
    }
}
