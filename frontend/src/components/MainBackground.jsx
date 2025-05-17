import "../css/main-background.css"

const MainBackground = ({ children }) => {
  return (
    <div className="main-background">
      <div className="background-shape shape-1"></div>
      <div className="background-shape shape-2"></div>
      <div className="background-shape shape-3"></div>
      <div className="background-shape shape-4"></div>
      <div className="content-wrapper">{children}</div>
    </div>
  )
}

export default MainBackground

