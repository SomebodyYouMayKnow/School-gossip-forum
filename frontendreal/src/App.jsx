import { Routes, Route } from 'react-router-dom';
import Login from './Pages/Login';
import Register from './Pages/Register';
import NotFound from './Pages/NotFound';
import Home from './Pages/Home';
import Navbar from './Pages/Navbar';
import './Pages/Pages.css';
import Test from './Pages/test';
import CreatePostPage from './Pages/CreatePost';
import ViewPosts from './Pages/viewposts';
import PostDetail from './Pages/PostDetail';
import EmailVerification from './Pages/EmailVerification';
import Contact from './Pages/Contact';
import PublicPolls from './Pages/Polls';
import PollDetail from './Pages/PollDetail';

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
        <Route path="/test" element={<Test />} />
        <Route path='/Createpost' element={<CreatePostPage />} />
        <Route path='/viewposts' element={<ViewPosts />} />
        <Route path='/posts' element={<PostDetail />} />
        <Route path='/verify-email' element={<EmailVerification />} />
        <Route path='/contact' element={<Contact />} />
        <Route path='/polls' element={<PublicPolls />} />
        <Route path='/polls/:id' element={<PollDetail />} />
        <Route path='*' element={<NotFound />} />
      </Routes>
    </>
  );
}

export default App;