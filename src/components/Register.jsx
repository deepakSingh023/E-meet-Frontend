import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../store/authSlice";


export default function Register() {

  const[username, setUsername] = useState("");
  const[password, setPassword] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { isLoading, error } = useSelector((state) => state.auth);

  const handleSubmit = (e) => {
      e.preventDefault();
      dispatch(registerUser({ username, password })).then((result) => {
        if (result.meta.requestStatus === "fulfilled") {
          navigate("/login"); // Redirect on success
        }
      });
    };


   

  return (
    <div className="flex justify-center items-center h-screen bg-gray-200">

       <div >      
       <form className="shadow-2xl p-19 "onSubmit={handleSubmit}>   
       <div><h1 className="flex justify-center text-3xl mb-5">Register</h1></div> <br /> 
           <input type="text" placeholder="Username" className="border radius-half text-xl" onChange={(e) => setUsername(e.target.value)}/> <br /> <br/>
           <input type="password" placeholder="Password" className="border text-xl" onChange={(e) => setPassword(e.target.value)}/> <br />
           <div className="flex justify-center">
             <button type="submit" className="bg-red-500 mt-5 p-2 radius-medium  " disabled={isLoading}> {isLoading ? "Registering in..." : "Register"}</button>
           </div>
           
       </form>
       </div>
      
    </div>
  )
}
