import Notes from "./Notes";
const Home = (props) => {

  return (

    <div className="container my-3 container card border-secondary"  style={{ padding:"20px"}}>

      <Notes showAlert={props.showAlert} />
    </div>
  );
};

export default Home;
