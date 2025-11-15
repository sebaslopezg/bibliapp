import { useState, useEffect } from 'react';

function App() {
  
  return <>

    <div id="controlls">
        <input type="text" autocomplete="off" id="cuadro_busqueda" />
        <input type="button" id="buscar" />
        <input id="rango" type="range" min="16" max="90" />
        <u id="sugerencias"></u>
    </div>

    <div class="rule"></div>
    <p id="mostrar"></p>

  </>
}

export default App;