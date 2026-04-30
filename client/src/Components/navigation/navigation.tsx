import './navigation.css'
import Login from '../login/login'

interface Props {
  currentUser: string | null
  setCurrentUser: (u: string | null) => void
}

function Navigation({ currentUser, setCurrentUser }: Props) {
  return (
    <div className="navigation">
      <div>
        <button className='nav-button'>chat</button>
        <button className='nav-button'>files</button>
        <button className='nav-button'>kanban</button>
      </div>

      <div style={{ marginTop: 'auto' }}>
        <Login currentUser={currentUser} setCurrentUser={setCurrentUser} />
      </div>
    </div>
  )
}

export default Navigation