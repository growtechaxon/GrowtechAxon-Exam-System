const express=require("express");
const Certificate=require("../Models/Certificate");
const TestResult=require("../Models/TestResult");
const { buildCertificatePdf }=require("../Utils/pdf");
const router=express.Router();

router.get("/certificates/verify",async(req,res)=>{
  const {certificateId,email}=req.query;
  if(!certificateId)return res.status(400).json({message:"Certificate ID is required."});
  const c=await Certificate.findOne({certificateId:String(certificateId).trim().toUpperCase()}).lean();
  if(!c || c.status!=="valid")return res.status(404).json({valid:false,message:"Certificate not found or revoked."});
  if(email && c.email!==String(email).trim().toLowerCase())return res.status(404).json({valid:false,message:"Certificate ID and email do not match."});
  res.json({valid:true,certificate:{certificateId:c.certificateId,candidateName:c.candidateName,testTitle:c.testTitle,issueDate:c.issueDate,percentage:c.percentage,grade:c.grade,status:c.status}});
});

router.get("/certificates/:id/pdf",async(req,res)=>{
  const {email}=req.query;
  const c=await Certificate.findOne({certificateId:String(req.params.id).trim().toUpperCase()});
  if(!c || c.status!=="valid")return res.status(404).json({message:"Certificate not found or revoked."});
  if(email && c.email!==String(email).trim().toLowerCase())return res.status(403).json({message:"Email verification failed."});
  buildCertificatePdf(c,res);
});

module.exports=router;