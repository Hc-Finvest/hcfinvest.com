const competitionEmailTemplate = ({ name, competitionName, startDate }) => {
  return `
    <div style="font-family: Arial; padding:20px;">
      
      <h2 style="color:#16A34A;">🎉 Congratulations ${name}!</h2>

      <p>You have successfully joined:</p>

      <h3 style="color:#2563EB;">${competitionName}</h3>

      <p><b>Start Date:</b> ${new Date(startDate).toDateString()}</p>

      <br/>

      <p>🚀 Get ready to compete and win exciting rewards!</p>

      <br/>

      <p>Best Regards,<br/>HC Finvest Team</p>

    </div>
  `;
};

export default competitionEmailTemplate;