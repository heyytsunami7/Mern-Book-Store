import React, { useEffect, useState } from 'react'
import BookCard from '../components/BookCard';

const API = import.meta.env.VITE_API_URL;

const BestSellerBooks = () => {
    const [ books, setBooks ] = useState([]);

    useEffect(()=>{
        fetch(`${API}/all-books`).then(res => res.json()).then(data => setBooks((data.books || []).slice(0,6)));
    },[])
  return (
    <div>
        <BookCard books={books} headline="Best Seller Books"/>
    </div>
  )
}

export default BestSellerBooks