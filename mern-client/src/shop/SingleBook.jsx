import React from 'react'
import { useLoaderData } from "react-router-dom";

const SingleBook = () => {
  const { bookTitle, authorName, imageURL, category, bookDescription, bookPDFUrl } = useLoaderData();
  return (
    <div className='mt-28 px-4 lg:px-24'>
      <div className='flex flex-col md:flex-row gap-12'>
        <div className='md:w-1/3'>
          <img src={imageURL} alt={bookTitle} className='w-full rounded shadow-lg' />
        </div>
        <div className='md:w-2/3 space-y-4'>
          <h2 className='text-4xl font-bold text-gray-900'>{bookTitle}</h2>
          <p className='text-lg text-gray-600'>By <span className='font-semibold'>{authorName}</span></p>
          <span className='inline-block bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded'>{category}</span>
          <p className='text-gray-700 leading-relaxed'>{bookDescription}</p>
          {bookPDFUrl && (
            <a
              href={bookPDFUrl}
              target="_blank"
              rel="noopener noreferrer"
              className='inline-block bg-blue-700 text-white font-semibold px-6 py-2 rounded hover:bg-black transition-all duration-300'
            >
              Download / Read PDF
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

export default SingleBook