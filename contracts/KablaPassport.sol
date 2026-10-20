// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

/// @title KablaPassport (testnet sketch, NOT deployed)
/// @notice A tiny, non-transferable, ERC-721-shaped record: one token per Kabla passport, holding only the
///         passport's SHA-256 certificate hash. Verify can compare that hash with the one in the app.
/// @dev Why not a full ERC-721 library: the hackathon build must not depend on a package download, and a
///      passport is evidence of agreed terms, so it should not be tradable. Transfers revert. This contract
///      has not been audited and has never been deployed anywhere. Testnet only; never use on mainnet.
///      All data it would ever hold in the demo is SYNTHETIC.
contract KablaPassport {
    string public constant name = "Kabla Passport (testnet sketch)";
    string public constant symbol = "KPASS";

    address public immutable issuer;       // the demo deployer; only it may issue
    uint256 public totalSupply;

    mapping(uint256 => address) private _ownerOf;
    mapping(uint256 => bytes32) public certificateHash;   // SHA-256 of the passport certificate
    mapping(bytes32 => uint256) public tokenOfHash;       // reverse lookup so Verify can ask "is this hash on-chain?"

    // Same event shape as ERC-721, so explorers and wallets can read it.
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);

    error NotIssuer();
    error AlreadyIssued();
    error NonTransferable();
    error NoSuchToken();

    constructor() {
        issuer = msg.sender;
    }

    /// @notice Issue a passport token to `to` for a certificate hash. Each hash can be issued once.
    function issue(address to, bytes32 hash) external returns (uint256 tokenId) {
        if (msg.sender != issuer) revert NotIssuer();
        if (tokenOfHash[hash] != 0) revert AlreadyIssued();
        tokenId = ++totalSupply;               // ids start at 1 so 0 can mean "none" in tokenOfHash
        _ownerOf[tokenId] = to;
        certificateHash[tokenId] = hash;
        tokenOfHash[hash] = tokenId;
        emit Transfer(address(0), to, tokenId);
    }

    function ownerOf(uint256 tokenId) external view returns (address) {
        address o = _ownerOf[tokenId];
        if (o == address(0)) revert NoSuchToken();
        return o;
    }

    /// @notice True when this certificate hash has been issued as a token.
    function isIssued(bytes32 hash) external view returns (bool) {
        return tokenOfHash[hash] != 0;
    }

    // Passports are evidence, not assets: every transfer path reverts.
    function transferFrom(address, address, uint256) external pure { revert NonTransferable(); }
    function safeTransferFrom(address, address, uint256) external pure { revert NonTransferable(); }
    function approve(address, uint256) external pure { revert NonTransferable(); }
    function setApprovalForAll(address, bool) external pure { revert NonTransferable(); }
}
