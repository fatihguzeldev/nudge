abstract class Client<T> {
  abstract sendMessage(payload: T): Promise<void>
}

export default Client
