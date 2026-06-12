# Contribution Rules

## Pham vi duoc phep chinh sua

Chi duoc phep chinh sua code trong cac folder sau:

- `Entites/`
- `Repository/`
- `Database/`
- `Controllers/`
- `Service/`

Neu `Controllers/` hoac `Service/` chua ton tai, chi duoc tao moi khi phuc vu truc tiep cho chuc nang dang lam.

## Khong duoc tu y sua

Khong tu y chinh sua cac file hoac folder ngoai danh sach tren, dac biet la:

- `Program.cs`
- `Extensions/`
- `Properties/`
- `NuGet/`
- `appsettings.json`
- `appsettings.Development.json`
- `.csproj`
- `.sln`

## Rule cho Controller

Controller phai lam theo dung format sau:

- Dat trong `Controllers/`
- Ke thua `ControllerBase`
- Co `[ApiController]`
- Co `[Route("api/[controller]")]`
- Inject service qua constructor
- Dung `ResponseDto` de tra ve du lieu
- Moi action phai boc trong `try/catch`
- Thanh cong thi `return Ok(response)`
- Loi thi `return BadRequest(response)`
- Dat message hang so nhu mau `REPORT_LIST_SUCCESS`
- Co `SwaggerOperation(Summary = "...")`

Controller chi duoc:

- Nhan request
- Goi service
- Gan `response.Data`
- Gan `response.Message`
- Tra response

Controller khong duoc:

- Viet nghiep vu lon
- Query truc tiep database
- Xu ly mapping phuc tap
- Chua logic validate nghiep vu dai dong

## Rule cho Interface Service

Interface service phai lam theo dung format sau:

- Dat trong `Service/IService/`
- Ten dang `I...Service`
- Chi khai bao ham
- Dung `Task<...>` hoac `Task`
- Khong viet logic trong interface

Vi du:

- `IAccountService`
- `IBusDamageReportService`

## Rule cho Service

Service phai lam theo dung format sau:

- Dat trong `Service/`
- Implement interface tu `Service/IService/`
- Inject `IRepository<T>` qua constructor
- Neu can token thi inject them `IJwtService`
- Xu ly nghiep vu trong service
- Query du lieu qua `_repo.Get()`
- Dung `Include(...)`, `FirstOrDefaultAsync(...)`, `ToListAsync(...)` khi can
- Nem exception ro rang khi co loi

Service duoc phep:

- Xu ly login
- Xu ly CRUD
- Validate nghiep vu
- Query va mapping du lieu
- Goi nhieu repository

Service khong duoc:

- Viet response HTTP
- Tra `IActionResult`
- Dat annotation API

## Rule cho Repository

Repository phai dung theo interface hien tai:

- `Get()`
- `GetValuesAsync()`
- `AddAsync()`
- `AddRangeAsync()`
- `Update()`
- `Delete()`
- `DeleteRange()`
- `ClearChangeTracking()`
- `BeginTransaction()`
- `SaveChangesAsync()`

Khong tu y tao kieu repository khac neu chua duoc yeu cau.

## Nguyen tac lam viec

- Uu tien sua entity, repository, database, controller, service de hoan thanh tinh nang.
- Khong xoa, doi ten, hoac refactor file ngoai pham vi neu chua co yeu cau ro rang.
- Khong them thu vien moi, khong doi cau hinh he thong, khong doi startup flow neu chua duoc phep.
- Neu can sua ngoai pham vi, phai xin xac nhan truoc.

## Muc tieu

Giu codebase on dinh, de review, de onboard, va de moi nguoi vao la biet cach viet dung chuan du an.
