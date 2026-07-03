import ContactsInbox from '../../components/ContactsInbox'
import { roomService } from '../../services/roomService'

export default function ContactsPage() {
  return <ContactsInbox fetchList={roomService.getContacts} onHandle={roomService.handleContact} />
}
