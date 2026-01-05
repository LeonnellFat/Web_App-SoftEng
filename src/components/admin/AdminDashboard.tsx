import { useState } from "react";
import { AdminLayout } from "./AdminLayout";
import { AdminReports } from "./AdminReports";
import { AdminOrders } from "./AdminOrders";
import { AdminProducts } from "./AdminProducts";
import { AdminOccasions } from "./AdminOccasions";
import { AdminBouquetColors } from "./AdminBouquetColors";
import { AdminFlowerTypes } from "./AdminFlowerTypes";
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
      case "bouquet-colors":
        return <AdminBouquetColors colors={bouquetColors} onUpdateColors={onUpdateBouquetColors} />;
      case "categories":
        return <AdminOccasions />;
      case "flower-types":
        return <AdminFlowerTypes flowers={flowerTypes} onUpdateFlowers={onUpdateFlowerTypes} />;
      case "drivers":
        return <AdminDrivers />;
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
