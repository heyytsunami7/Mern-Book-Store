import React, { useEffect, useState } from 'react'
import BookCard from '../components/BookCard';

const BestSellerBooks = () => {
    const [ books, setBooks ] = useState([]);

    useEffect(()=>{
        fetch("https://mern-book-store-red.vercel.app/all-books").then(res => res.json()).then(data => setBooks(data.slice(0,6)));
    },[])
  return (
    <div>
        <BookCard books={books} headline="Best Seller Books"/>
    </div>
  )
}

export default BestSellerBooks