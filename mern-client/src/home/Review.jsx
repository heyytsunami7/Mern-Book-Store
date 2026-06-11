import React, { useRef, useState } from "react";
// Import Swiper React components
import { Swiper, SwiperSlide } from "swiper/react";
import { FaStar,FaRegStar ,FaStarHalfStroke } from "react-icons/fa6";
// Import Swiper styles
import "swiper/css";
import "swiper/css/pagination";
import { Avatar } from "flowbite-react";
import proPic from '../assets/profile.jpg'
//import './styles.css';

// import required modules
import { Pagination } from "swiper/modules";

const Review = () => {
  return (
    <div className="my-12 px-4 lg:px-24">
      <h2 className="text-5xl font-bold text-center mb-10 leading-snug">
        Our Customer
      </h2>
      <div>
        <Swiper
          slidesPerView={1}
          spaceBetween={30}
          pagination={{
            clickable: true,
          }}
          breakpoints={{
            640: {
              slidesPerView: 1,
              spaceBetween: 20,
            },
            768: {
              slidesPerView: 2,
              spaceBetween: 40,
            },
            1024: {
              slidesPerView: 3,
              spaceBetween: 50,
            },
          }}
          modules={[Pagination]}
          className="mySwiper"
        >
          <SwiperSlide className="shadow-2xl bg-white py-8 px-4 md:m-5 rounded-lg">
            <div className="space-y-6">
              <div className="text-amber-500 flex gap-2">
                <FaStar />
                <FaStar />
                <FaStar />
                <FaStarHalfStroke />
                <FaRegStar />
              </div>
              {/*text */}
              <div className="mt-7">
                <p className="mb-5">
                  Lorem ipsum dolor sit, amet consectetur adipisicing elit.
                  Facere qui facilis quidem sapiente ab in libero dolore, quis
                  obcaecati autem suscipit omnis quibusdam quisquam voluptas
                  accusamus quo. Distinctio nesciunt possimus, voluptate tempore
                  accusamus unde quia libero eos cumque earum ut.
                </p>
                <Avatar
                 img={proPic} 
                 alt="avatar of Jese" 
                 rounded
                 className="w-10 mb-4"
                />
                <h5 className="text-lg font-medium">Bhipendar kumar</h5>
                <p className="text-base ">CEO, MMI</p>
              </div>
            </div>
          </SwiperSlide>
          <SwiperSlide className="shadow-2xl bg-white py-8 px-4 md:m-5 rounded-lg">
            <div className="space-y-6">
              <div className="text-amber-500 flex gap-2">
                <FaStar />
                <FaStar />
                <FaStar />
                <FaStar />
                <FaRegStar />
              </div>
              {/*text */}
              <div className="mt-7">
                <p className="mb-5">
                  Lorem ipsum dolor sit, amet consectetur adipisicing elit.
                  Facere qui facilis quidem sapiente ab in libero dolore, quis
                  obcaecati autem suscipit omnis quibusdam quisquam voluptas
                  accusamus quo. Distinctio nesciunt possimus, voluptate tempore
                  accusamus unde quia libero eos cumque earum ut.
                </p>
                <Avatar
                 img={proPic} 
                 alt="avatar of Jese" 
                 rounded
                 className="w-10 mb-4"
                />
                <h5 className="text-lg font-medium">Gopal Gohel</h5>
                <p className="text-base ">CEO, Haria uni</p>
              </div>
            </div>
          </SwiperSlide>
          <SwiperSlide className="shadow-2xl bg-white py-8 px-4 md:m-5 rounded-lg">
            <div className="space-y-6">
              <div className="text-amber-500 flex gap-2">
                <FaStar />
                <FaStar />
                <FaStar />
                <FaStarHalfStroke />
                <FaRegStar />
              </div>
              {/*text */}
              <div className="mt-7">
                <p className="mb-5">
                  Lorem ipsum dolor sit, amet consectetur adipisicing elit.
                  Facere qui facilis quidem sapiente ab in libero dolore, quis
                  obcaecati autem suscipit omnis quibusdam quisquam voluptas
                  accusamus quo. Distinctio nesciunt possimus, voluptate tempore
                  accusamus unde quia libero eos cumque earum ut.
                </p>
                <Avatar
                 img={proPic} 
                 alt="avatar of Jese" 
                 rounded
                 className="w-10 mb-4"
                />
                <h5 className="text-lg font-medium">Soumya Singh</h5>
                <p className="text-base ">CEO, nothing</p>
              </div>
            </div>
          </SwiperSlide>
          <SwiperSlide className="shadow-2xl bg-white py-8 px-4 md:m-5 rounded-lg">
            <div className="space-y-6">
              <div className="text-amber-500 flex gap-2">
                <FaStar />
                <FaStar />
                <FaStar />
                <FaStar />
                <FaRegStar />
              </div>
              {/*text */}
              <div className="mt-7">
                <p className="mb-5">
                  Lorem ipsum dolor sit, amet consectetur adipisicing elit.
                  Facere qui facilis quidem sapiente ab in libero dolore, quis
                  obcaecati autem suscipit omnis quibusdam quisquam voluptas
                  accusamus quo. Distinctio nesciunt possimus, voluptate tempore
                  accusamus unde quia libero eos cumque earum ut.
                </p>
                <Avatar
                 img={proPic} 
                 alt="avatar of Jese" 
                 rounded
                 className="w-10 mb-4"
                />
                <h5 className="text-lg font-medium">Akash Maurya</h5>
                <p className="text-base ">CEO, Main Building</p>
              </div>
            </div>
          </SwiperSlide>
        </Swiper>
      </div>
    </div>
  );
};

export default Review;
