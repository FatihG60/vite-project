import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { FileUpload } from "primereact/fileupload";
import { InputTextarea } from "primereact/inputtextarea";
import { TabMenu } from "primereact/tabmenu";
import { useEffect, useState } from "react";

interface Customer {
  id: number;
  name: string;
  email: string;
  country: string;
  status: string;
}

function MainTab() {
  const [activeIndex, setActiveIndex] = useState(0);
  const items = [
    {
      label: "İÇERİ TAŞI",
      icon: "pi pi-cloud-upload",
    },
    { label: "DIŞARI TAŞI", icon: "pi pi-cloud-download" },
  ];

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );

  useEffect(() => {
    const mockCustomers: Customer[] = [
      {
        id: 1,
        name: "John Doe",
        email: "john@example.com",
        country: "USA",
        status: "Active",
      },
      {
        id: 2,
        name: "Jane Roe",
        email: "jane@example.com",
        country: "UK",
        status: "Inactive",
      },
      {
        id: 3,
        name: "Max Mustermann",
        email: "max@example.com",
        country: "Germany",
        status: "Active",
      },
      {
        id: 4,
        name: "Maria Garcia",
        email: "maria@example.com",
        country: "Spain",
        status: "Pending",
      },
    ];

    setCustomers(mockCustomers);
  }, []);

  // Durum hücresi için dinamik sınıf ekleyen template
  const statusBodyTemplate = (rowData: Customer) => {
    return (
      <span className={`customer-badge status-${rowData.status.toLowerCase()}`}>
        {rowData.status}
      </span>
    );
  };

  return (
    <Card>
      <TabMenu
        className="flex justify-content-center"
        activeIndex={activeIndex}
        model={items}
        onTabChange={(e) => setActiveIndex(e.index)}
      />
      {activeIndex == 0 ? (
        <Card className="flex flex-column">
          <FileUpload />
          <InputTextarea
            className="h-10rem w-full my-4"
            autoResize
            placeholder="Açıklama"
          />
          <Button
            className="w-full"
            label="Taşıma"
            severity="success"
            outlined
          />
        </Card>
      ) : (
        <Card className="flex flex-column ">
          <DataTable
            value={customers}
            selection={selectedCustomer}
            onSelectionChange={(e) => setSelectedCustomer(e.value as Customer)}
            dataKey="id"
          >
            <Column
              selectionMode="multiple"
              headerStyle={{ width: "3em" }}
            ></Column>{" "}
            <Column
              field="id"
              header="ID"
              sortable
              style={{ width: "5%" }}
            ></Column>
            <Column
              field="name"
              header="Name"
              sortable
              style={{ width: "25%" }}
            ></Column>
            <Column
              field="email"
              header="Email"
              sortable
              style={{ width: "25%" }}
            ></Column>
            <Column
              field="country"
              header="Country"
              sortable
              style={{ width: "20%" }}
            ></Column>
            <Column
              field="status"
              header="Status"
              body={statusBodyTemplate}
              sortable
              style={{ width: "10%" }}
            ></Column>
          </DataTable>
          <InputTextarea
            className="h-10rem w-full my-4"
            autoResize
            placeholder="Açıklama"
          />
          <Button
            className="w-full"
            label="Taşıma"
            severity="success"
            outlined
          />
        </Card>
      )}
    </Card>
  );
}

export default MainTab;
