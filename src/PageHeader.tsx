import { APP_NAME } from "./common/consts";
import MenuBar from "./MenuBar.jsx";
import { Modes } from "./common/consts";

interface PageHeaderProps {
  subheading: string;
  mode: Modes;
  setMode: (mode: Modes) => void;
}

const PageHeader = ({ subheading, mode, setMode }: PageHeaderProps) => {
  return (
    <>
      <header className="App-header">
        <p className="font-cinzel font-shadow App-title">{APP_NAME}</p>
        <p className="font-cinzel font-shadow App-subheading">{subheading}</p>
      </header>
      <MenuBar {...{ mode, setMode }} />
    </>
  );
};

export default PageHeader;
