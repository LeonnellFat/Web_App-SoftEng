import { useState } from "react";
import { AdminLayout } from "./AdminLayout";
import { AdminReports } from "./AdminReports";
import { AdminOrders } from "./AdminOrders";
import { AdminProducts } from "./AdminProducts";
import { AdminOccasions } from "./AdminOccasions";
import { AdminDrivers } from "./AdminDrivers";
import type { Order } from "../../App";
import type { BouquetColor, FlowerType } from "../../data/bouquetData";

interface AdminDashboardProps {
  onLogout: () => void;
  orders: Order[];
  onUpdateOrders: (orders: Order[]) => void;
  bouquetColors: BouquetColor[];
  onUpdateBouquetColors: (colors: BouquetColor[]) => void;
  flowerTypes: FlowerType[];
  onUpdateFlowerTypes: (flowers: FlowerType[]) => void;
}

export function AdminDashboard({ onLogout, orders, onUpdateOrders, bouquetColors, onUpdateBouquetColors, flowerTypes, onUpdateFlowerTypes }: AdminDashboardProps) {
  const [currentSection, setCurrentSection] = useState("reports");

  const renderSection = () => {
    switch (currentSection) {
      case "reports":
        return <AdminReports orders={orders} />;
      case "orders":
        return <AdminOrders orders={orders} onUpdateOrders={onUpdateOrders} />;
      case "products":
        return <AdminProducts />;
      case "categories":
        return <AdminOccasions />;
      case "drivers":
        return <AdminDrivers orders={orders} />;
      default:
        return <AdminReports orders={orders} />;
    }
  };

  return (
    <AdminLayout
      currentSection={currentSection}
      onSectionChange={setCurrentSection}
      onLogout={onLogout}
    >
      {renderSection()}
    </AdminLayout>
  );
}
