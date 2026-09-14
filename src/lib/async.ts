export class RequestTimeoutError extends Error {
  constructor(message = "استغرق الطلب وقتًا أطول من المتوقع. تحقق من اتصالك ثم حاول مرة أخرى.") {
    super(message);
    this.name = "RequestTimeoutError";
  }
}

export function withTimeout<T>(promise: PromiseLike<T>, timeoutMs = 15_000): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = window.setTimeout(() => reject(new RequestTimeoutError()), timeoutMs);

    Promise.resolve(promise).then(
      (value) => {
        window.clearTimeout(timeoutId);
        resolve(value);
      },
      (error: unknown) => {
        window.clearTimeout(timeoutId);
        reject(error);
      }
    );
  });
}
