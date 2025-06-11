/**
 * Module API cơ sở sử dụng Axios
 */
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { API_BASE_URL, API_CONFIG, ENDPOINTS } from "./constants.js";

/**
 * Interface cho API Request
 */
export interface ApiRequest {
  url: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD" | "OPTIONS";
  headers?: Record<string, string>;
  body?: any;
  params?: Record<string, string>;
  timeout?: number;
  auth?: {
    type: "bearer" | "basic" | "api-key";
    token?: string;
    username?: string;
    password?: string;
    apiKey?: string;
    apiKeyHeader?: string;
  };
}

/**
 * Interface cho API Response
 */
export interface ApiResponse {
  data: any;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  url: string;
  method: string;
  duration: number;
}

/**
 * Lớp API cơ sở sử dụng Axios
 */
export class ApiClient {
  private axiosInstance: AxiosInstance;

  constructor(baseUrl: string = API_BASE_URL) {
    // Khởi tạo Axios instance với cấu hình cơ bản
    this.axiosInstance = axios.create({
      baseURL: baseUrl,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    // Thêm interceptor xử lý lỗi
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error: any) => {
        if (error.response) {
          console.error(
            `Lỗi API: ${error.response.status} ${error.response.statusText}`
          );
        } else if (error.request) {
          console.error("Lỗi kết nối: Không nhận được phản hồi");
        } else {
          console.error(`Lỗi: ${error.message}`);
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Thực hiện yêu cầu GET
   * @param endpoint Endpoint API
   * @param params Tham số truy vấn
   * @returns Dữ liệu phản hồi
   */
  async get<T>(
    endpoint: string,
    params: Record<string, string> = {}
  ): Promise<T> {
    try {
      const response = await this.axiosInstance.get<T>(endpoint, { params });
      return response.data;
    } catch (error) {
      console.error(`Lỗi khi gọi GET ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Thực hiện yêu cầu POST
   * @param endpoint Endpoint API
   * @param data Dữ liệu gửi đi
   * @returns Dữ liệu phản hồi
   */
  async post<T>(endpoint: string, data: any): Promise<T> {
    try {
      const response = await this.axiosInstance.post<T>(endpoint, data);
      return response.data;
    } catch (error) {
      console.error(`Lỗi khi gọi POST ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Thực hiện yêu cầu PUT
   * @param endpoint Endpoint API
   * @param data Dữ liệu gửi đi
   * @returns Dữ liệu phản hồi
   */
  async put<T>(endpoint: string, data: any): Promise<T> {
    try {
      const response = await this.axiosInstance.put<T>(endpoint, data);
      return response.data;
    } catch (error) {
      console.error(`Lỗi khi gọi PUT ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Thực hiện yêu cầu DELETE
   * @param endpoint Endpoint API
   * @param params Tham số truy vấn (tùy chọn)
   * @returns Dữ liệu phản hồi
   */
  async delete<T>(
    endpoint: string,
    params: Record<string, string> = {}
  ): Promise<T> {
    try {
      const response = await this.axiosInstance.delete<T>(endpoint, { params });
      return response.data;
    } catch (error) {
      console.error(`Lỗi khi gọi DELETE ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Thực hiện yêu cầu PATCH
   * @param endpoint Endpoint API
   * @param data Dữ liệu gửi đi
   * @returns Dữ liệu phản hồi
   */
  async patch<T>(endpoint: string, data: any): Promise<T> {
    try {
      const response = await this.axiosInstance.patch<T>(endpoint, data);
      return response.data;
    } catch (error) {
      console.error(`Lỗi khi gọi PATCH ${endpoint}:`, error);
      throw error;
    }
  }
}

/**
 * Universal API Fetcher - Hỗ trợ tất cả HTTP methods với headers và body
 */
export class ApiFetcher {
  /**
   * Thực hiện API request với đầy đủ tính năng
   */
  static async fetch(request: ApiRequest): Promise<ApiResponse> {
    const startTime = Date.now();

    try {
      // Chuẩn bị config cho axios
      const config: AxiosRequestConfig = {
        url: request.url,
        method: request.method.toLowerCase() as any,
        timeout: request.timeout || API_CONFIG.TIMEOUT,
        headers: { ...request.headers },
        params: request.params,
      };

      // Xử lý body cho các method cần
      if (["POST", "PUT", "PATCH"].includes(request.method) && request.body) {
        config.data = request.body;
      }

      // Xử lý authentication
      if (request.auth) {
        switch (request.auth.type) {
          case "bearer":
            if (request.auth.token) {
              config.headers!["Authorization"] = `Bearer ${request.auth.token}`;
            }
            break;
          case "basic":
            if (request.auth.username && request.auth.password) {
              const credentials = Buffer.from(
                `${request.auth.username}:${request.auth.password}`
              ).toString("base64");
              config.headers!["Authorization"] = `Basic ${credentials}`;
            }
            break;
          case "api-key":
            if (request.auth.apiKey) {
              const headerName = request.auth.apiKeyHeader || "X-API-Key";
              config.headers![headerName] = request.auth.apiKey;
            }
            break;
        }
      }

      // Thực hiện request
      const response = await axios(config);
      const duration = Date.now() - startTime;

      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers as Record<string, string>,
        url: request.url,
        method: request.method,
        duration,
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;

      if (error.response) {
        // Server responded with error status
        return {
          data: error.response.data,
          status: error.response.status,
          statusText: error.response.statusText,
          headers: error.response.headers as Record<string, string>,
          url: request.url,
          method: request.method,
          duration,
        };
      } else if (error.request) {
        // Request was made but no response received
        throw new Error(
          `Không nhận được phản hồi từ ${request.url}: ${error.message}`
        );
      } else {
        // Something else happened
        throw new Error(`Lỗi khi tạo request: ${error.message}`);
      }
    }
  }

  /**
   * Shorthand methods cho các HTTP verbs phổ biến
   */
  static async get(
    url: string,
    options: Partial<ApiRequest> = {}
  ): Promise<ApiResponse> {
    return this.fetch({ ...options, url, method: "GET" });
  }

  static async post(
    url: string,
    body?: any,
    options: Partial<ApiRequest> = {}
  ): Promise<ApiResponse> {
    return this.fetch({ ...options, url, method: "POST", body });
  }

  static async put(
    url: string,
    body?: any,
    options: Partial<ApiRequest> = {}
  ): Promise<ApiResponse> {
    return this.fetch({ ...options, url, method: "PUT", body });
  }

  static async patch(
    url: string,
    body?: any,
    options: Partial<ApiRequest> = {}
  ): Promise<ApiResponse> {
    return this.fetch({ ...options, url, method: "PATCH", body });
  }

  static async delete(
    url: string,
    options: Partial<ApiRequest> = {}
  ): Promise<ApiResponse> {
    return this.fetch({ ...options, url, method: "DELETE" });
  }
}
