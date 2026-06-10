"use client";

import { useActionState, useState, useEffect, useCallback } from "react";
import { createUser, listUsers, toggleUserActive } from "@/actions/usuarios";

const initialState = { error: "" as string, success: "" as string };

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  createdAt: Date | string;
}

export default function AdminUsuariosPage() {
  const [state, action, isPending] = useActionState(createUser as any, initialState);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const fetchUsers = useCallback(async () => {
    try {
      const result = await listUsers();
      if (!("error" in result) && result.users) {
        setUsers(result.users);
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleToggle = async (userId: string) => {
    try {
      const result = await toggleUserActive(userId);
      if ("success" in result) {
        setMsg(result.success || "");
        setTimeout(() => setMsg(""), 3000);
        fetchUsers();
      }
    } catch {}
  };

  const roleLabel = (role: string) => {
    return role === "registrador" ? "Registrador" : role === "procurador" ? "Procurador" : "Administrador";
  };

  const roleBadgeClass = (role: string) => {
    if (role === "registrador") return "badge-info";
    if (role === "procurador") return "badge-success";
    return "badge-purple";
  };

  return (
    <div className="max-w-5xl space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Gerenciamento de Usuários</h1>
          <p className="page-subtitle">Crie e gerencie contas de acesso ao sistema</p>
        </div>
        {msg && (
          <div className="toast toast-success">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            {msg}
          </div>
        )}
      </div>

      {/* Create User Form */}
      <div className="stat-card stat-card-blue">
        <div className="p-5">
          <h2 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-primary-light" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/></svg>
            Novo Procurador
          </h2>

          {state?.error && (
            <div className="toast toast-error mb-4">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" strokeWidth="2"/><path strokeLinecap="round" strokeWidth="2" d="M12 8v4m0 4h.01"/></svg>
              {state.error}
            </div>
          )}
          {state?.success && (
            <div className="toast toast-success mb-4">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              {state.success}
            </div>
          )}

          <form action={action} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nome</label>
              <input name="name" type="text" required className="w-full" placeholder="Nome completo" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email</label>
              <input name="email" type="email" required className="w-full" placeholder="email@mpc.sc.gov.br" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Senha</label>
              <input name="password" type="password" required minLength={6} className="w-full" placeholder="Mínimo 6 caracteres" />
            </div>
            <button type="submit" disabled={isPending} className="btn btn-primary">
              {isPending ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  Criando...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
                  Criar Procurador
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Users Table */}
      <div className="table-container">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Email</th>
              <th>Perfil</th>
              <th>Status</th>
              <th className="text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="!py-0 !border-0">
                  <div className="flex flex-col gap-3 py-6 px-2">
                    <div className="skeleton h-8 w-full" />
                    <div className="skeleton h-8 w-full" />
                    <div className="skeleton h-8 w-3/4" />
                  </div>
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="!border-0">
                  <div className="flex flex-col items-center justify-center py-12">
                    <svg className="w-10 h-10 text-gray-200 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                    <span className="text-sm text-gray-400">Nenhum usuário cadastrado.</span>
                  </div>
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-primary">
                          {user.name?.charAt(0)?.toUpperCase()}
                        </span>
                      </div>
                      <span className="font-semibold text-gray-800">{user.name}</span>
                    </div>
                  </td>
                  <td className="text-gray-500">{user.email}</td>
                  <td>
                    <span className={`badge ${roleBadgeClass(user.role)}`}>
                      {roleLabel(user.role)}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${user.active ? "badge-success" : "badge-danger"}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${user.active ? "bg-green-500" : "bg-red-500"}`} />
                      {user.active ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="text-center">
                    <button
                      onClick={() => handleToggle(user.id)}
                      className={`btn btn-xs ${user.active ? "btn-danger" : "btn-primary"}`}
                    >
                      {user.active ? (
                        <>
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/></svg>
                          Desativar
                        </>
                      ) : (
                        <>
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                          Ativar
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
