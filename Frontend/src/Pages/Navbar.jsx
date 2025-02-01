import React from 'react'

function openNav() {
    console.log('open')
    document.getElementById("mySidepanel").style.width = "15vw";
}

function closeNav() {
    document.getElementById("mySidepanel").style.width = "0";
    console.log('close')
}

const Navbar = () => {
    return (
        <>
            <div id="mySidepanel" className="sidepanel">
                <a href="javascript:void(0)" className="closebtn" onClick={closeNav}>×</a>
                <a href='/'>Home</a>
                <a href='/Login'>Login</a>
                <a href='/Register'>Register</a>
            </div>

            <button className="openbtn" onClick={openNav}>☰ Menu</button>
        </>
    )
}

export default Navbar