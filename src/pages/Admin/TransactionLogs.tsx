import React from "react";
import PageMeta from "../../components/common/PageMeta";
import TransactionLogsTable from "../../components/tables/Admin/TransactionLogsTable";
import ComponentCard from "../../components/common/ComponentCard";

export default function AdminTransactionLogs() {
  return (
    <>
      <PageMeta
        title="Transaction Logs | Admin Dashboard"
        description="View all transaction logs"
      />
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
            Transaction Logs
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            View all deposits, withdrawals, and investments
          </p>
        </div>

        <ComponentCard>
          <TransactionLogsTable />
        </ComponentCard>
      </div>
    </>
  );
}
