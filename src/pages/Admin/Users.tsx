import React from "react";
import PageMeta from "../../components/common/PageMeta";
import UsersTable from "../../components/tables/Admin/UsersTable";
import ComponentCard from "../../components/common/ComponentCard";

export default function AdminUsers() {
  return (
    <>
      <PageMeta
        title="Users Management | Admin Dashboard"
        description="Manage all users in the system"
      />
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
            Users Management
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            View and manage all users in the system
          </p>
        </div>

        <ComponentCard>
          <UsersTable />
        </ComponentCard>
      </div>
    </>
  );
}
