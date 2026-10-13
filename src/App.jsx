import React from 'react';
import SpaceScene from './components/SpaceScene/SpaceScene';
import Portfolio from './components/Portfolio/Portfolio';
import { SHOW_PORTFOLIO } from './config/appConfig';

function App() {
    return (
        <>
            {SHOW_PORTFOLIO && <Portfolio/>}
            <SpaceScene/>
        </>
    )
}

export default App;
