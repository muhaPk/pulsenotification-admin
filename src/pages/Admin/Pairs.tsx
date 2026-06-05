import React from "react";
import PageMeta from "../../components/common/PageMeta";
import PairsTable from "../../components/tables/Admin/PairsTable";
import ComponentCard from "../../components/common/ComponentCard";

export default function AdminPairs() {
  return (
    <>
      <PageMeta
        title="Pairs Management | Admin Dashboard"
        description="View all pairs created by users"
      />
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
            Pairs Management
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            View all unique pairs created by users
          </p>
        </div>

        <ComponentCard>
          <PairsTable />
        </ComponentCard>
      </div>
    </>
  );
}
