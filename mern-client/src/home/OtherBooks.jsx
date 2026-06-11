import BookCard from '../components/BookCard';
import React, { useEffect, useState } from 'react'

const OtherBooks = () => {
    const [ books, setBooks ] = useState([]);

    useEffect(()=>{
        fetch("https://mern-book-store-red.vercel.app/all-books").then(res => res.json()).then(data => setBooks(data.slice(6,12)));
    },[])
  return (
    <div>
        <BookCard books={books} headline="Other Books"/>
    </div>
  )
}

export default OtherBooks