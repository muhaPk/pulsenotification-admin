import React from "react";
import PageMeta from "../../components/common/PageMeta";
import AddressesTable from "../../components/tables/Admin/AddressesTable";
import ComponentCard from "../../components/common/ComponentCard";

export default function AdminAddresses() {
  return (
    <>
      <PageMeta
        title="Addresses Management | Admin Dashboard"
        description="Manage all Bitcoin addresses in the system"
      />
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
            Bitcoin Addresses
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            View and manage all Bitcoin addresses
          </p>
        </div>

        <ComponentCard>
          <AddressesTable />
        </ComponentCard>
      </div>
    </>
  );
}
