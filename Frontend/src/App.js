import { Route, Routes } from 'react-router-dom';
import './App.css';
import { Login } from './Pages/Login';
import { Register } from './Pages/Register';
import NotFound from './Pages/NotFound';
import Home from './Pages/Home';
import Navbar from './Pages/Navbar';

function App() {
  return (
    <>
      <Navbar />
      <br></br>
      <br></br>
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/Login' element={<Login />} />
        <Route path='/Register' element={<Register />} />
        <Route path='*' element={<NotFound />} />
      </Routes>
    </>
  )
}

export default App;
