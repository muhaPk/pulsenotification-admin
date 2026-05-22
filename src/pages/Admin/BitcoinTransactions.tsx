import React from "react";
import PageMeta from "../../components/common/PageMeta";
import BitcoinTransactionsTable from "../../components/tables/Admin/BitcoinTransactionsTable";
import ComponentCard from "../../components/common/ComponentCard";

export default function AdminBitcoinTransactions() {
  return (
    <>
      <PageMeta
        title="Bitcoin Transactions | Admin Dashboard"
        description="View all Bitcoin transactions"
      />
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
            Bitcoin Transactions
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            View all Bitcoin transactions on the blockchain
          </p>
        </div>

        <ComponentCard>
          <BitcoinTransactionsTable />
        </ComponentCard>
      </div>
    </>
  );
}
