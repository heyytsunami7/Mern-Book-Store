import BookCard from '../components/BookCard';
import React, { useEffect, useState } from 'react'

const API = import.meta.env.VITE_API_URL;

const OtherBooks = () => {
    const [ books, setBooks ] = useState([]);

    useEffect(()=>{
        fetch(`${API}/all-books`).then(res => res.json()).then(data => setBooks((data.books || []).slice(6,12)));
    },[])
  return (
    <div>
        <BookCard books={books} headline="Other Books"/>
    </div>
  )
}

export default OtherBooks