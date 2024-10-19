import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { FileUpload } from "primereact/fileupload";
import { InputTextarea } from "primereact/inputtextarea";

export const Upload = () => {
  return (
    <Card className="flex flex-column">
      <FileUpload />
      <InputTextarea
        className="h-10rem w-full my-4"
        autoResize
        placeholder="Açıklama"
      />
      <Button className="w-full" label="Taşıma" severity="success" outlined />
    </Card>
  );
};
