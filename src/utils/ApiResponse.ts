class ApiResponse {
  constructor(
    public statusCode: number,
    public data: Record<string, any>,
    public message = "Success",
    public success = statusCode < 400,
  ) {}
}
