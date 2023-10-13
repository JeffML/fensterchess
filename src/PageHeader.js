import { APP_NAME } from "./common/consts.js";
import MenuBar from "./MenuBar.js";

const PageHeader = ({ subheading, mode, setMode }) => {
    return (
        <>
            <header className="App-header">
                <p className="font-cinzel font-shadow App-title">{APP_NAME}</p>
                <p className="font-cinzel font-shadow App-subheading">
                    {subheading}
                </p>
            </header>
            <MenuBar {...{mode, setMode}}/>
        </>
    );
};

export default PageHeader;
