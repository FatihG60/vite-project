import { Card } from "primereact/card";
import { TabMenu } from "primereact/tabmenu";
import { useState } from "react";
import { Upload } from "../components/Upload";
import { Download } from "../components/Download";

function MainTab() {
  const [activeIndex, setActiveIndex] = useState(0);
  const items = [
    {
      label: "İÇERİ TAŞI",
      icon: "pi pi-cloud-upload",
    },
    { label: "DIŞARI TAŞI", icon: "pi pi-cloud-download" },
  ];

  return (
    <Card>
      <TabMenu
        className="flex justify-content-center"
        activeIndex={activeIndex}
        model={items}
        onTabChange={(e) => setActiveIndex(e.index)}
      />
      {activeIndex == 0 ? <Upload /> : <Download />}
    </Card>
  );
}

export default MainTab;
