<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<title>Certificate Portal | Growtech Axon</title>

<link rel="stylesheet" href="/assets/style.css">

<style>
*{
  box-sizing:border-box;
}

body{
  margin:0;
  font-family:Arial,Helvetica,sans-serif;
  background:
    radial-gradient(circle at top left,#dbeafe 0,#eef6ff 25%,#f8fbff 60%,#eaf3ff 100%);
  color:#09275a;
}

/* =========================
   PAGE
========================= */

.page{
  min-height:100vh;
  padding:45px 20px;
}

.portal{
  max-width:1200px;
  margin:auto;
}

/* =========================
   SEARCH BOX
========================= */

.search-card{
  max-width:700px;
  margin:0 auto 35px;
  background:#ffffff;
  padding:28px;
  border-radius:18px;
  box-shadow:0 18px 50px rgba(7,42,92,.12);
  border:1px solid #d8e7f8;
}

.search-card h1{
  margin:0 0 8px;
  text-align:center;
  font-size:28px;
  color:#09275a;
}

.search-card p{
  text-align:center;
  color:#64748b;
  margin:0 0 22px;
}

.form-grid{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:14px;
}

.field label{
  display:block;
  font-size:13px;
  font-weight:700;
  margin-bottom:6px;
  color:#173d73;
}

.field input{
  width:100%;
  padding:13px 14px;
  border:1px solid #cbdced;
  border-radius:10px;
  outline:none;
  font-size:14px;
}

.field input:focus{
  border-color:#1683e8;
  box-shadow:0 0 0 3px rgba(22,131,232,.10);
}

.verify-btn{
  width:100%;
  margin-top:16px;
  border:0;
  border-radius:10px;
  padding:14px;
  background:linear-gradient(135deg,#0759c7,#168be8);
  color:white;
  font-weight:800;
  font-size:15px;
  cursor:pointer;
}

.verify-btn:hover{
  transform:translateY(-1px);
}

.message{
  margin-top:14px;
  text-align:center;
  font-size:14px;
  font-weight:600;
}

.hidden{
  display:none!important;
}

/* =========================
   CERTIFICATE
========================= */

.certificate-wrap{
  width:100%;
  overflow:auto;
  padding:5px;
}

.certificate{
  position:relative;
  width:1120px;
  min-height:790px;
  margin:auto;
  overflow:hidden;

  background:
    radial-gradient(circle at 18% 35%,rgba(30,136,229,.08),transparent 22%),
    radial-gradient(circle at 85% 55%,rgba(30,136,229,.07),transparent 25%),
    linear-gradient(135deg,#ffffff,#f6fbff);

  border:7px solid #0757a8;

  box-shadow:
    0 25px 70px rgba(7,43,88,.20);
}

/* gold inner border */

.certificate::before{
  content:"";
  position:absolute;
  inset:11px;
  border:2px solid #d8a82d;
  pointer-events:none;
}

/* thin inner blue */

.certificate::after{
  content:"";
  position:absolute;
  inset:18px;
  border:1px solid #6ea8dc;
  pointer-events:none;
}

/* =========================
   CORNER RIBBONS
========================= */

.corner{
  position:absolute;
  width:220px;
  height:130px;
  z-index:1;
}

.corner.top-left{
  top:-5px;
  left:-5px;
  background:
    linear-gradient(135deg,
      #063b82 0 45%,
      #168be8 45% 62%,
      transparent 62%);
}

.corner.top-left::after{
  content:"";
  position:absolute;
  width:190px;
  height:8px;
  background:#e2b33c;
  transform:rotate(-34deg);
  top:52px;
  left:-15px;
}

.corner.bottom-right{
  bottom:-5px;
  right:-5px;
  background:
    linear-gradient(315deg,
      #063b82 0 45%,
      #168be8 45% 62%,
      transparent 62%);
}

.corner.bottom-right::after{
  content:"";
  position:absolute;
  width:190px;
  height:8px;
  background:#e2b33c;
  transform:rotate(-34deg);
  bottom:52px;
  right:-15px;
}

/* =========================
   WATERMARK
========================= */

.watermark{
  position:absolute;
  left:50%;
  top:53%;
  transform:translate(-50%,-50%);
  width:430px;
  height:430px;
  border-radius:50%;

  background:
    radial-gradient(circle,
      rgba(20,112,202,.07),
      rgba(20,112,202,.025) 55%,
      transparent 70%);

  display:flex;
  align-items:center;
  justify-content:center;

  pointer-events:none;
}

.watermark span{
  font-size:190px;
  font-weight:900;
  color:rgba(13,91,170,.035);
}

/* =========================
   HEADER
========================= */

.cert-header{
  position:relative;
  z-index:3;

  display:flex;
  justify-content:space-between;
  align-items:flex-start;

  padding:45px 58px 0;
}

.logo-area{
  display:flex;
  align-items:center;
  gap:13px;
}

.logo-area img{
  width:155px;
  max-height:70px;
  object-fit:contain;
}

.cert-number{
  text-align:right;
  padding-top:7px;
}

.cert-number small{
  display:block;
  color:#36577e;
  font-size:13px;
  margin-bottom:5px;
}

.cert-number strong{
  font-size:14px;
  letter-spacing:.5px;
  color:#09275a;
}

/* =========================
   TITLE
========================= */

.title-section{
  position:relative;
  z-index:3;
  text-align:center;
  margin-top:25px;
}

.title-line{
  display:flex;
  align-items:center;
  justify-content:center;
  gap:18px;
}

.title-line span{
  width:110px;
  height:2px;
  background:#d7a62e;
}

.title-section h1{
  margin:0;
  font-family:Georgia,"Times New Roman",serif;
  font-size:58px;
  letter-spacing:2px;
  color:#09275a;
}

.subtitle{
  margin-top:2px;
  color:#1683e8;
  font-family:Georgia,"Times New Roman",serif;
  font-size:28px;
  font-weight:bold;
  letter-spacing:4px;
}

/* =========================
   PRESENTED TO
========================= */

.presented{
  position:relative;
  z-index:3;
  text-align:center;
  margin-top:25px;
}

.presented-label{
  font-size:14px;
  letter-spacing:4px;
  font-weight:700;
  color:#173d73;
}

.candidate-name{
  margin:8px 0 3px;

  font-family:
    "Brush Script MT",
    "Segoe Script",
    "Lucida Handwriting",
    cursive;

  font-size:54px;
  font-style:italic;
  font-weight:500;
  color:#0b438f;
}

.name-line{
  width:470px;
  height:2px;
  background:#d6a72e;
  margin:0 auto 12px;
}

/* =========================
   DESCRIPTION
========================= */

.description{
  position:relative;
  z-index:3;
  text-align:center;
  color:#294b76;
  font-size:16px;
}

.test-title{
  margin-top:7px;
  font-size:25px;
  font-weight:800;
  color:#0874d1;
}

/* =========================
   RESULT STATS
========================= */

.stats{
  position:relative;
  z-index:3;

  display:flex;
  justify-content:center;
  align-items:center;

  gap:0;
  margin-top:25px;
}

.stat{
  min-width:190px;
  text-align:center;
  padding:0 30px;
}

.stat + .stat{
  border-left:1px solid #d5a72e;
}

.stat-label{
  font-size:12px;
  letter-spacing:2px;
  font-weight:800;
  color:#36577e;
}

.stat-value{
  margin-top:5px;
  font-size:25px;
  font-weight:900;
  color:#0a428c;
}

/* =========================
   BOTTOM
========================= */

.bottom-area{
  position:absolute;
  left:65px;
  right:65px;
  bottom:55px;

  display:grid;
  grid-template-columns:1fr 180px 1fr;
  align-items:end;

  z-index:4;
}

/* =========================
   VERIFICATION
========================= */

.verify-area{
  text-align:left;
}

.verify-box{
  width:92px;
  height:92px;

  border:2px solid #0a5daf;
  border-radius:10px;

  display:flex;
  align-items:center;
  justify-content:center;

  background:#fff;
  margin-bottom:8px;
}

.qr-pattern{
  width:67px;
  height:67px;
  background:
    linear-gradient(90deg,#09275a 10px,transparent 10px 17px,#09275a 17px 25px,transparent 25px 34px,#09275a 34px 42px,transparent 42px 50px,#09275a 50px 67px),
    linear-gradient(#09275a 10px,transparent 10px 18px,#09275a 18px 27px,transparent 27px 38px,#09275a 38px 48px,transparent 48px 55px,#09275a 55px 67px);
  opacity:.9;
}

.verify-text{
  font-size:11px;
  color:#52708f;
}

.verify-text strong{
  display:block;
  color:#123d71;
  margin-top:3px;
}

/* =========================
   SEAL
========================= */

.seal{
  width:135px;
  height:135px;
  margin:auto;

  border-radius:50%;

  background:
    radial-gradient(circle,
      #0a3772 0 53%,
      #d9a72d 54% 62%,
      #0a3772 63% 68%,
      #d9a72d 69% 100%);

  display:flex;
  align-items:center;
  justify-content:center;

  box-shadow:
    0 5px 12px rgba(0,0,0,.15);
}

.seal-inner{
  width:102px;
  height:102px;
  border:2px solid #f4d77d;
  border-radius:50%;

  color:white;
  text-align:center;

  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:center;

  font-weight:900;
}

.seal-inner .top{
  font-size:11px;
  letter-spacing:2px;
}

.seal-inner .axon{
  font-size:22px;
  letter-spacing:2px;
}

.stars{
  color:#f4cf67;
  letter-spacing:3px;
  margin-top:2px;
}

/* =========================
   SIGNATURE
========================= */

.signature-area{
  text-align:center;
  justify-self:end;
  width:245px;
}

.signature{
  display:inline-block;

  font-family:
    "Brush Script MT",
    "Segoe Script",
    "Lucida Handwriting",
    cursive;

  font-size:30px;
  font-style:italic;
  font-weight:500;

  color:#075fbd;

  transform:rotate(-4deg);

  margin-bottom:-2px;
}

.signature-line{
  height:1px;
  background:#d6a72e;
  width:220px;
  margin:auto;
}

.signatory-name{
  margin-top:7px;
  font-size:14px;
  font-weight:800;
  color:#123d71;
}

.signatory-designation{
  margin-top:3px;
  font-size:11px;
  color:#617995;
}

/* =========================
   FOOTER
========================= */

.footer-text{
  position:absolute;
  bottom:20px;
  left:0;
  width:100%;
  text-align:center;

  font-size:9px;
  letter-spacing:5px;
  font-weight:800;

  color:#1b5da0;
  z-index:5;
}

/* =========================
   DOWNLOAD BUTTON
========================= */

.download-wrap{
  text-align:center;
  margin-top:25px;
}

.download-btn{
  display:inline-block;
  text-decoration:none;

  padding:13px 24px;

  background:#09275a;
  color:white;

  border-radius:10px;

  font-weight:800;
  font-size:14px;
}

.download-btn:hover{
  background:#0759a8;
}

/* =========================
   MOBILE
========================= */

@media(max-width:800px){

  .form-grid{
    grid-template-columns:1fr;
  }

  .page{
    padding:20px 10px;
  }

  .certificate-wrap{
    overflow-x:auto;
  }

  .certificate{
    transform-origin:top left;
  }

}

</style>
</head>

<body>

<div class="page">

  <div class="portal">

    <!-- =========================
         SEARCH
    ========================== -->

    <section class="search-card">

      <h1>Certificate Verification</h1>

      <p>
        Enter your Certificate ID and examination email
        to view your certificate.
      </p>

      <div class="form-grid">

        <div class="field">
          <label>Certificate ID</label>
          <input
            id="certificateId"
            type="text"
            placeholder="GTA-XXXXXXXX"
            autocomplete="off"
          >
        </div>

        <div class="field">
          <label>Email Address</label>
          <input
            id="email"
            type="email"
            placeholder="your@email.com"
          >
        </div>

      </div>

      <button
        id="verifyBtn"
        class="verify-btn"
      >
        ✓ Verify Certificate
      </button>

      <div
        id="message"
        class="message"
      ></div>

    </section>


    <!-- =========================
         CERTIFICATE
    ========================== -->

    <section
      id="certificateSection"
      class="certificate-wrap hidden"
    >

      <div class="certificate">

        <div class="corner top-left"></div>
        <div class="corner bottom-right"></div>

        <div class="watermark">
          <span>GA</span>
        </div>


        <!-- HEADER -->

        <div class="cert-header">

          <div class="logo-area">

            <img
              src="/assets/growtechaxon-logo.png"
              alt="Growtech Axon"
            >

          </div>

          <div class="cert-number">

            <small>Certificate No.</small>

            <strong id="certId">
              —
            </strong>

          </div>

        </div>


        <!-- TITLE -->

        <div class="title-section">

          <div class="title-line">
            <span></span>

            <h1>CERTIFICATE</h1>

            <span></span>
          </div>

          <div class="subtitle">
            OF ACHIEVEMENT
          </div>

        </div>


        <!-- CANDIDATE -->

        <div class="presented">

          <div class="presented-label">
            THIS CERTIFICATE IS PROUDLY PRESENTED TO
          </div>

          <div
            id="candidateName"
            class="candidate-name"
          >
            Candidate Name
          </div>

          <div class="name-line"></div>

        </div>


        <!-- DESCRIPTION -->

        <div class="description">

          <div>
            for successfully completing the online assessment
          </div>

          <div
            id="testTitle"
            class="test-title"
          >
            Assessment
          </div>

          <div style="margin-top:6px;">
            conducted by Growtech Axon.
          </div>

        </div>


        <!-- STATS -->

        <div class="stats">

          <div class="stat">

            <div class="stat-label">
              PERCENTAGE
            </div>

            <div
              id="percentage"
              class="stat-value"
            >
              —
            </div>

          </div>


          <div class="stat">

            <div class="stat-label">
              GRADE
            </div>

            <div
              id="grade"
              class="stat-value"
            >
              —
            </div>

          </div>


          <div class="stat">

            <div class="stat-label">
              DATE OF ISSUE
            </div>

            <div
              id="issueDate"
              class="stat-value"
              style="font-size:18px;"
            >
              —
            </div>

          </div>

        </div>


        <!-- BOTTOM -->

        <div class="bottom-area">


          <!-- VERIFY -->

          <div class="verify-area">

            <div class="verify-box">
              <div class="qr-pattern"></div>
            </div>

            <div class="verify-text">
              Certificate Verification
              <strong>
                Scan / Verify Online
              </strong>
            </div>

          </div>


          <!-- SEAL -->

          <div class="seal">

            <div class="seal-inner">

              <div class="top">
                GROWTECH
              </div>

              <div class="axon">
                AXON
              </div>

              <div class="stars">
                ★ ★ ★
              </div>

              <div style="font-size:8px;margin-top:3px;">
                OFFICIAL SEAL
              </div>

            </div>

          </div>


          <!-- SIGNATURE -->

          <div class="signature-area">

            <div
              id="signature"
              class="signature"
            >
              Ram
            </div>

            <div class="signature-line"></div>

            <div
              id="signatoryName"
              class="signatory-name"
            >
              Ram Bhsrosa Prasad
            </div>

            <div
              id="signatoryDesignation"
              class="signatory-designation"
            >
              Authorized Signatory
            </div>

          </div>

        </div>


        <div class="footer-text">
          BUILDING A SKILLED TOMORROW
        </div>

      </div>


      <!-- DOWNLOAD -->

      <div class="download-wrap">

        <a
          id="downloadBtn"
          class="download-btn"
          href="#"
        >
          ↓ Download Certificate PDF
        </a>

      </div>

    </section>

  </div>

</div>


<script>

const $ = id =>
  document.getElementById(id);


/* =========================
   HELPERS
========================= */

function escapeHTML(value){

  return String(value ?? "")
    .replace(/[&<>"']/g, char => ({
      "&":"&amp;",
      "<":"&lt;",
      ">":"&gt;",
      '"':"&quot;",
      "'":"&#039;"
    }[char]));

}


function formatDate(value){

  if(!value) return "—";

  const date = new Date(value);

  if(isNaN(date.getTime())){
    return "—";
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day:"2-digit",
      month:"short",
      year:"numeric"
    }
  );

}


/* =========================
   VERIFY
========================= */

async function verifyCertificate(){

  const certificateId =
    $("certificateId")
      .value
      .trim()
      .toUpperCase();

  const email =
    $("email")
      .value
      .trim();

  $("certificateSection")
    .classList
    .add("hidden");

  $("message").textContent =
    "";

  if(!certificateId){

    $("message").textContent =
      "Please enter Certificate ID.";

    $("message").style.color =
      "#dc2626";

    return;
  }


  if(!email){

    $("message").textContent =
      "Please enter your examination email.";

    $("message").style.color =
      "#dc2626";

    return;
  }


  const button =
    $("verifyBtn");

  button.disabled = true;

  button.textContent =
    "Checking Certificate...";


  try{

    const url =
      `/api/certificates/verify` +
      `?certificateId=${encodeURIComponent(certificateId)}` +
      `&email=${encodeURIComponent(email)}`;


    const response =
      await fetch(url);


    let data = {};

    try{

      data =
        await response.json();

    }catch{

      data = {};

    }


    if(
      !response.ok ||
      !data.valid
    ){

      throw new Error(
        data.message ||
        "Certificate could not be verified."
      );

    }


    const certificate =
      data.certificate;


    /* =========================
       FILL CERTIFICATE
    ========================== */

    $("certId").textContent =
      certificate.certificateId ||
      certificateId;


    $("candidateName").textContent =
      certificate.candidateName ||
      "Candidate";


    $("testTitle").textContent =
      certificate.testTitle ||
      "Assessment";


    $("percentage").textContent =
      certificate.percentage != null
        ? `${certificate.percentage}%`
        : "—";


    $("grade").textContent =
      certificate.grade ||
      "Completed";


    $("issueDate").textContent =
      formatDate(
        certificate.issueDate
      );


    /* =========================
       SIGNATURE
    ========================== */

    const signatory =
      certificate.signatoryName ||
      "Ram Bhsrosa Prasad";


    $("signatoryName").textContent =
      signatory;


    $("signature").textContent =
      "Ram";


    $("signatoryDesignation").textContent =
      certificate.signatoryDesignation ||
      "Authorized Signatory";


    /* =========================
       DOWNLOAD
    ========================== */

    $("downloadBtn").href =
      `/api/certificates/${encodeURIComponent(certificateId)}/pdf` +
      `?email=${encodeURIComponent(email)}`;


    /* =========================
       SHOW
    ========================== */

    $("certificateSection")
      .classList
      .remove("hidden");


    $("message").textContent =
      "✓ Certificate verified successfully.";

    $("message").style.color =
      "#15803d";


    setTimeout(() => {

      $("certificateSection")
        .scrollIntoView({
          behavior:"smooth",
          block:"start"
        });

    },100);


  }catch(error){

    console.error(
      "Certificate verification error:",
      error
    );

    $("message").textContent =
      error.message ||
      "Certificate verification failed.";

    $("message").style.color =
      "#dc2626";

  }finally{

    button.disabled = false;

    button.textContent =
      "✓ Verify Certificate";

  }

}


/* =========================
   EVENTS
========================= */

$("verifyBtn")
  .addEventListener(
    "click",
    verifyCertificate
  );


$("certificateId")
  .addEventListener(
    "input",
    () => {

      $("certificateId").value =
        $("certificateId")
          .value
          .toUpperCase();

    }
  );


$("certificateId")
  .addEventListener(
    "keydown",
    event => {

      if(event.key === "Enter"){
        verifyCertificate();
      }

    }
  );


$("email")
  .addEventListener(
    "keydown",
    event => {

      if(event.key === "Enter"){
        verifyCertificate();
      }

    }
  );

</script>

</body>
</html>