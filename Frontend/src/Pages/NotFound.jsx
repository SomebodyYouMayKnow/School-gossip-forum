import React from 'react'
import { Link } from 'react-router-dom'


const NotFound = () => {
    return (
        <div id='Not_Found'>
            <img src='UhOh.jpg'></img>
            <h1> Error 404</h1>
            <h4>Oh no! Looks like this page doesn't exist :(</h4>
            <Link to="/">Lets get you back on track ;)</Link>
        </div>
    )
}

export default NotFound