import ContactsInbox from '../../components/ContactsInbox'
import { bookingService } from '../../services'

export default function ContactsPage() {
  return <ContactsInbox fetchList={bookingService.contacts} onHandle={bookingService.handleContact} />
}
